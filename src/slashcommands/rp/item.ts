import Discord, { ActionRow, ButtonInteraction } from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'item',
    description: 'Benutze ein Item',
    battlelock: true,
    options: [
        {
            name: 'item',
            description: 'Das Item, das du benutzen möchtest',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    execute: async function (interaction: Discord.CommandInteraction | Discord.ButtonInteraction, args, client) {
        const { user, color } = interaction
        const index = args.item

        //@ts-ignore
        let item: BattleAction = {...user.storage.data.inventory[index]._doc}
        item = Object.assign(item, objectLoader([item.id]).get(item.id))
        item.onLoad && item.onLoad()

        if(!item.name) return interaction.error('Unbekanntes Item', 'Dieses Item scheint nicht zu existieren', true)
        if(!item.count) return interaction.error('Keine Items', 'Du hast dieses Item nicht', true)

        let type = item.type.split('/')[1] == 'med' ? 'Medizin' :
            item.type == 'atk' ? 'Kampfitem' :
            item.type == 'base' ? 'Basis-Item' : 'Item'
        
        let embed = new Discord.EmbedBuilder()
            .setColor(color.normal)
            //@ts-ignore
            .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
            .setDescription(`Anzahl: **${item.count}**\nTyp: **${type}**\n${item.description}` || `Anzahl: **${item.count}**\nTyp: **${type}**\nKeine Beschreibung verfügbar`)

        let button = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('item_use:' + index)
                    .setLabel('Einsetzen')
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setDisabled(!item.inventoryUsable)
            )
        
        let res = await interaction.reply({ embeds: [embed], components: [button], ephemeral: true })

        interaction = await res.awaitMessageComponent({ componentType: Discord.ComponentType.Button, time: 300000 }).catch(() => null)
        while(interaction) {
            interaction.color = color
            //@ts-ignore
            if(!item.count) return interaction.error('Keine Items', 'Du hast dieses Item nicht', true)
            let output: any = true
            if(item.onInvUse) {
                //@ts-ignore
                output = await item.onInvUse(item, user, interaction)
            }
            let embed
            if(output && (!output?.length || output?.[0])) {
                if(item.aHeal) user.storage.data.battle.hp += item.aHeal.value
                if(item.rHeal) user.storage.data.battle.hp += Math.round(user.storage.data.battle.skills.find((s: any) => s.name == 'HP').value * item.rHeal.value)
                if(user.storage.data.battle.hp > user.storage.data.battle.skills.find((s: any) => s.name == 'HP').value) user.storage.data.battle.hp = user.storage.data.battle.skills.find((s: any) => s.name == 'HP').value
                // TODO: Stat modifiers
                item.count --
                user.storage.data.inventory.items[index].count --
                if(user.storage.data.inventory.items[index].count <= 0) user.storage.data.inventory.items.splice(user.storage.data.inventory.items.findIndex(i => i.id === index), 1)
                await user.save()
                embed = new Discord.EmbedBuilder()
                    .setColor(color.normal)
                    //@ts-ignore
                    .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
                    .setDescription(`Anzahl: **${item.count}**\nTyp: **${type}**\n${item.description}` || `Anzahl: **${item.count}**\nTyp: **${type}**\nKeine Beschreibung verfügbar`)
                    .setFooter({ text: typeof output === 'string' ? output : 'Das Item wurde erfolgreich angewandt.' })
                button.components[0].setDisabled(!item.count)
            } else embed = new Discord.EmbedBuilder()
                .setColor(color.normal)
                //@ts-ignore
                .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
                .setDescription(`Anzahl: **${item.count}**\nTyp: **${type}**\n${item.description}` || `Anzahl: **${item.count}**\nTyp: **${type}**\nKeine Beschreibung verfügbar`)
                .setFooter({ text: output == null ? 'Der Vorgang wurde abgebrochen' : output?.length && !output[0] ? output[1] : 'Das Item konnte nicht benutzt werden' })

            //@ts-ignore
            await interaction.update({ embeds: [embed], components: [button] })
            interaction = await res.awaitMessageComponent({ componentType: Discord.ComponentType.Button, time: 120000 }).catch(() => null)
        }
    }
}

export default options