const discord = require('discord.js')
const embeds = require('../../../embeds')
const PvPBattle = require('../../../battledata/PvPBattle')

module.exports = {
    name: 'battle',
    description: 'Woäk in pwogwess',
    options: [
        {
            name: 'user',
            description: 'Der herausgeforderte Nutzer',
            required: true, 
            type: 'USER'
        }
    ],
    before: require('../../../subcommands/before/battle'),
    execute: async function(ita, args, client) {
        let { user, color, guild } = ita
        let { user: target } = args

        //Angegebenen Nutzer überprüfen
        target = await guild.members.fetch(target).catch(async () => {
            return await ita.error('Fehler', 'Der Nutzer ist nicht auf dem Server.', true)
        })

        await target.user.getData()
        if(!target.user.data.battle?.ready) return await ita.error('Fehler', 'Der Nutzer ist nicht bereit für einen Kampf.', true)

        //Herausforderung
        let embed = new discord.MessageEmbed()
            .setColor(color.yellow)
            .setTitle('Herausforderung erfolgreich')
            .setDescription(`Du hast ${target} erfolgreich herausgefordert.\nDer Kampf wird initialisiert, sobald eine Antwort auf die Herausforderung vorliegt. In 5 Minuten wird die Herausforderung automatisch abgebrochen.`)
        await ita.safeReply({ embeds: [embed], ephemeral: true })
        embed
            .setTitle('Herausforderung')
            .setDescription(`${user} hat ${target} zu einem Kampf herausgefordert!`)
        let buttons = new discord.MessageActionRow()
            .setComponents(
                new discord.MessageButton()
                    .setLabel('Annehmen')
                    .setStyle('SUCCESS')
                    .setCustomId('battle.accept'),
                new discord.MessageButton()
                    .setLabel('Ablehnen')
                    .setStyle('DANGER')
                    .setCustomId('battle.decline')
            )
        let message = await ita.followUp({ embeds: [embed], components: [buttons], content: `${target}: Du wurdest von ${user.tag} zu einem Kampf herausgefordert.`, fetchReply: true })
        message.edit({ embeds: [embed], components: [buttons], content: null })
        const filter = (i) => i.user.id === target.id
        let interaction = await message.awaitMessageComponent({ filter, time: 300000 }).catch(() => {})
        if(!interaction) {
            await embeds.errorMessage(message, 'Herausforderung abgebrochen', `Die Herausforderung wurde nicht rechtzeitig angenommen.`, true, false)
            await ita.error('Herausforderung abgebrochen', `Die Herausforderung wurde nicht rechtzeitig angenommen.`)
        }
        if(interaction.customId == 'battle.decline') {
            await ita.error('Herausforderung abgebrochen', `${target} hat deine Herausforderung abgelehnt.`)
            return await embeds.errorMessage(message, 'Herausforderung abgebrochen', `${target} hat die Herausforderung abgelehnt.`, true, false)
        }
        let battle = new PvPBattle(guild.members.cache.get(user.id)|| await guild.members.fetch(user.id), target, ita, interaction, message)
        battle.load()
    }
}