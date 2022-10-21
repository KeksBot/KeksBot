import Discord, { ActionRow, ButtonInteraction } from 'discord.js'
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
    execute: async function (interaction: Discord.CommandInteraction | Discord.ButtonInteraction, args, client) {
        const { user, color } = interaction
        const id = args.item

        let item: BattleActionBuilder & { count: number } = objectLoader([id]).get(id) || {}
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
        
        let res = await interaction.reply({ embeds: [embed], components: [button], ephemeral: true })

        interaction = await res.awaitMessageComponent({ componentType: Discord.ComponentType.Button, time: 120000 }).catch(() => null)
        while(interaction) {
            //@ts-ignore
            if(!item.count) return interaction.error('Keine Items', 'Du hast dieses Item nicht', true)
            if(item.aHeal) user.data.battle.currentHP += item.aHeal.value
            if(item.rHeal) user.data.battle.currentHP += Math.round(user.data.battle.skills.find(s => s.name == 'HP').value * item.rHeal.value)
            if(user.data.battle.currentHP > user.data.battle.skills.find(s => s.name == 'HP').value) user.data.battle.currentHP = user.data.battle.skills.find(s => s.name == 'HP').value
            // TODO: Stat modifiers
            item.count --
            user.data.battle.inventory.find(i => i.id == id).count --
            if(user.data.battle.inventory.find(i => i.id == id).count <= 0) user.data.battle.inventory.splice(user.data.battle.inventory.findIndex(i => i.id === id), 1)
            await user.save()
            let embed = new Discord.EmbedBuilder()
                .setColor(color.normal)
                //@ts-ignore
                .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
                .setDescription(`Anzahl: **${item.count}**\nTyp: **${type}**\n${item.description}` || `Anzahl: **${item.count}**\nTyp: **${type}**\nKeine Beschreibung verfügbar`)
                .setFooter({ text: 'Das Item wurde erfolgreich angewandt.' })
            button.components[0].setDisabled(!item.count)
            //@ts-ignore
            await interaction.update({ embeds: [embed], components: [button] })
            interaction = await res.awaitMessageComponent({ componentType: Discord.ComponentType.Button, time: 120000 }).catch(() => null)
        }
    }
}

export default options