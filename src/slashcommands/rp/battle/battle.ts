import Discord from 'discord.js'
import embeds from '../../../embeds'
import BaseBattle from '../../../battle/BaseBattle'
import before from '../../../subcommands/before/battle'
import BattleUser from '../../../battle/BattleUser'

const options: CommandOptions = {
    name: 'battle',
    description: 'Woäk in pwogwess',
    battlelock: true,
    options: [
        {
            name: 'user',
            description: 'Der herausgeforderte Nutzer',
            required: true, 
            type: Discord.ApplicationCommandOptionType.User
        }
    ],
    before,
    execute: async function(ita, args, client) {
        let { user, color, guild } = ita
        let target: Discord.GuildMember = args.user

        //@ts-ignore
        if(target == user.id) return ita.error('Fehler', 'Du kannst dich nicht selbst herausfordern.', true)

        //@ts-ignore Angegebenen Nutzer überprüfen
        target = await guild.members.fetch(target).catch(async () => {
            return await ita.error('Fehler', 'Der Nutzer ist nicht auf dem Server.', true)
        })
        if(!target.user.username) return

        await (async () => {
            let { healTimestamp, hp } = user.storage.data.battle
            console.log(user.storage.auto.stats.hp)
            let maxHP = Math.round(user.storage.auto.stats.hp)
            if(hp != maxHP) {
                let healBonus = user.storage.auto.stats.regeneration || 1
                let heal = maxHP / 100
                hp += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
                if(hp >= maxHP) {
                    hp = maxHP
                }
                healTimestamp = Date.now()
                user.storage.data.battle.healTimestamp = healTimestamp
                user.storage.data.battle.hp = hp
                await user.save()
            }
        })();

        if(user.storage.data.battle.hp <= 0) return await ita.error('Kampf unmöglich', 'In deinem aktuellen Zustand bist du kampfunfähig. Bitte ruhe dich noch etwas aus, bevor du jemanden herausforderst.', true)

        await target.user?.load()
        if(!target.user?.storage?.data?.battle?.ready) return await ita.error('Fehler', 'Der Nutzer ist nicht bereit für einen Kampf.', true);

        await (async () => {
            let { healTimestamp, hp } = target.user.storage.data.battle
            let maxHP = Math.round(target.user.storage.auto.stats.hp)
            if(hp != maxHP) {
                let healBonus = user.storage.auto.stats.regeneration || 1
                let heal = maxHP / 100
                hp += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
                if(hp >= maxHP) {
                    hp = maxHP
                }
                healTimestamp = Date.now()
                target.user.storage.data.battle.healTimestamp = healTimestamp
                target.user.storage.data.battle.hp = hp
                await target.user.save()
            }
        })();

        if(target.user.storage.data.battle.hp <= 0) return await ita.error('Kampf unmöglich', 'Dein Gegner ist aktuell kampfunfähig. Bitte warte einen Moment und probiere es nachher erneut.', true)

        //Herausforderung
        let embed = new Discord.EmbedBuilder()
            .setColor(color.yellow)
            .setTitle('Herausforderung erfolgreich')
            .setDescription(`Du hast ${target} erfolgreich herausgefordert.\nDer Kampf wird initialisiert, sobald eine Antwort auf die Herausforderung vorliegt. In 5 Minuten wird die Herausforderung automatisch abgebrochen.`)
        await ita.safeReply({ embeds: [embed], ephemeral: true })
        embed
            .setTitle('Herausforderung')
            .setDescription(`${user} hat ${target} zu einem Kampf herausgefordert!`)
        let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .setComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Annehmen')
                    .setStyle(Discord.ButtonStyle.Success)
                    .setCustomId('battle.accept'),
                new Discord.ButtonBuilder()
                    .setLabel('Ablehnen')
                    .setStyle(Discord.ButtonStyle.Danger)
                    .setCustomId('battle.decline')
            )
        let message = await ita.followUp({ embeds: [embed], components: [buttons], content: `${target}: Du wurdest von ${user.tag} zu einem Kampf herausgefordert.`, fetchReply: true })
        message.edit({ embeds: [embed], components: [buttons], content: null })
        const filter = (i: any) => i.user.id === target.id
        let interaction = await message.awaitMessageComponent({ filter, time: 300000, componentType: Discord.ComponentType.Button }).catch(() => {})
        if(!interaction) {
            await embeds.errorMessage(message, 'Herausforderung abgebrochen', `Die Herausforderung wurde nicht rechtzeitig angenommen.`, true, false)
            return ita.error('Herausforderung abgebrochen', `Die Herausforderung wurde nicht rechtzeitig angenommen.`)
        }
        if(interaction.customId == 'battle.decline') {
            await ita.error('Herausforderung abgebrochen', `${target} hat deine Herausforderung abgelehnt.`)
            return embeds.errorMessage(message, 'Herausforderung abgebrochen', `${target} hat die Herausforderung abgelehnt.`, true, false)
        }
        let battle = new BaseBattle(false, message, color)
        //@ts-ignore
        battle.addUser(new BattleUser(ita, 0))
        battle.addUser(new BattleUser(interaction, 1))
        if(await battle.load()) await battle.game()
    }
}

export default options