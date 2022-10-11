import Discord from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'item',
    description: 'Benutze ein Item',
    options: [
        {
            name: 'item',
            description: 'Das Item, das du benutzen möchtest',
            type: Discord.ApplicationCommandOptionType.String,
            required: true,
            autocomplete: true
        }
    ],
    execute: async function (interaction, args, client) {
        const { user, color } = interaction
        const id = args.item

        let item: BattleActionBuilder & { count: number } = objectLoader([id]).values().next()?.value || {}
        item.count = user.data.battle?.inventory?.find(i => i.id === id)?.count || 0

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
                    .setCustomId('item_use:' + id)
                    .setLabel('Einsetzen')
                    .setStyle(Discord.ButtonStyle.Primary)
                    .setDisabled(!item.inventoryUsable)
            )
        
        await interaction.reply({ embeds: [embed], components: [button], ephemeral: true })

        //TODO: Item usage logic
    }
}

export default options