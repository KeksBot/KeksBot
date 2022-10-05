import Discord from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'
function groupBy(list: Map<any, any>, keyGetter: (item: any) => any) {
    const map = new Map();
    list.forEach((item) => {
        const key = keyGetter(item);
        const collection = map.get(key);
        if (!collection) {
            map.set(key, [item]);
        } else {
            collection.push(item);
        }
    });
    return map;
}

const options: CommandOptions = {
    name: 'inventory',
    description: 'Zeigt dir dein Inventar an.',
    execute: async function (ita, args, client) {
        let { user, color, guild } = ita
        let inventory = user.data?.battle?.inventory
        if (!inventory || !inventory.length) return ita.error('Inventar leer', 'Du hast nichts im Inventar.', true)
        let items = objectLoader(inventory.map(i => parseInt(i.id)))
        items.forEach(i => {
            i.count = inventory.find(_i => _i.id == i.id).count
        })
        items = groupBy(items, item => item.type.split('/')[1])
        const itemtypes = [
            {
                label: 'Medizin',
                value: 'med',
            },
            {
                label: 'Kampf',
                value: 'atk'
            },
            {
                label: 'Items',
                value: 'item'
            },
            {
                label: 'Basis-Items',
                value: 'base'
            }
        ]
        let selectMenu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
            .addComponents(
                new Discord.SelectMenuBuilder()
                    .setCustomId('inventory')
                    .setPlaceholder('Kategorie auswählen')
                    .addOptions(itemtypes)
            )
        let embed = new Discord.EmbedBuilder()
            .setTitle('Inventar')
            .setColor(color.normal)
            .setDescription(`Kekse: ${user.data.cookies || 0}\nSternenstaub: ${items.get(2)?.count || 0}\nKometenstücke: ${items.get(3)?.count || 0}`)
        let response = await ita.reply({ embeds: [embed], components: [selectMenu], ephemeral: true })
        let interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => { console.log(e); return null })
        if(!interaction) return
        while(true) {
            //@ts-ignore
            switch(interaction.customId.split(':')[0]) {
                case 'inventory': {
                    //@ts-ignore
                    switch(interaction.values?.length ? interaction.values[0] : interaction.customId?.split(':')[1] || 'none') {
                        case 'none': {
                            let embed = new Discord.EmbedBuilder()
                                .setTitle('Inventar')
                                .setColor(color.normal)
                                .setDescription(`Kekse: ${user.data.cookies || 0}\nSternenstaub: ${items.get(2)?.count || 0}\nKometenstücke: ${items.get(3)?.count || 0}`)
                            //@ts-ignore
                            await interaction.update({ embeds: [embed], components: [selectMenu] })
                            break
                        }
                        default: {
                            //@ts-ignore
                            let type = interaction.values?.length ? interaction.values[0] : interaction.customId?.split(':')[1] || 'none'
                            let filter: Array<any> = items.get(type) || new Map()
                            let page = interaction.customId?.split(':')?.length > 2 ? parseInt(interaction.customId?.split(':')[2]) : 0
                            let embed = new Discord.EmbedBuilder()
                                .setColor(color.normal)
                                .setTitle(                            
                                    type == 'med' ? 'Medizinbeutel' :
                                    type == 'atk' ? 'Kampfbeutel' :
                                    type == 'item' ? 'Itembeutel' :
                                    type == 'base' ? 'Basis-Itembeutel' : 'Inventar'
                                )
                            !filter.length ? embed.setDescription('Hier ist nichts') :
                            embed.addFields(
                                filter.slice(page * 10, page * 10 + 10).map((i: any) => {
                                    return {
                                        //@ts-ignore
                                        name: i.emote ? `${emotes.items[i.emote] || '[ ]'} ${i.name}` : `[ ] ${i.name}`,
                                        value: `Anzahl: **${i.count}**\n${i.description}` || `Anzahl: **${i.count}**\nKeine Beschreibung verfügbar`,
                                        inline: false
                                    }
                                })
                            )
                            if(filter.length > 10) embed.setFooter({ text: `Seite ${page + 1} von ${Math.ceil(filter.length / 10)}` })
                            let itemSelector = filter.length ? new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                                .addComponents(
                                    new Discord.SelectMenuBuilder()
                                        .setCustomId(`inventory.item`)
                                        .setPlaceholder('Item auswählen')
                                        .addOptions(filter.map((i: any) => {
                                            return {
                                                label: `${i.name}`,
                                                value: i.id.toString(),
                                                //@ts-ignore
                                                emoji: i.emote ? emotes.items[i.emote] : undefined
                                            }
                                        }))
                                ) : null
                            let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                                .addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`inventory:none`)
                                        .setEmoji(emotes.back)
                                        .setStyle(Discord.ButtonStyle.Danger)
                                )
                            if(filter.length > 10) {
                                buttons.addComponents(
                                    new Discord.ButtonBuilder()
                                        .setCustomId(`inventory:${type}:0_`)
                                        .setEmoji(emotes.firstIndex)
                                        .setStyle(Discord.ButtonStyle.Secondary)
                                        .setDisabled(!page),
                                    new Discord.ButtonBuilder()
                                        .setCustomId(page ? `inventory:${type}:${page - 1}` : `inventory:${type}:0`)
                                        .setEmoji(emotes.back)
                                        .setStyle(Discord.ButtonStyle.Secondary)
                                        .setDisabled(!page),
                                    new Discord.ButtonBuilder()
                                        .setCustomId(page < Math.ceil(filter.length / 10) - 1 ? `inventory:${type}:${page + 1}` : `inventory:${type}:${page}`)
                                        .setEmoji(emotes.next)
                                        .setStyle(Discord.ButtonStyle.Secondary)
                                        .setDisabled(page == Math.ceil(filter.length / 10) - 1),
                                    new Discord.ButtonBuilder()
                                        .setCustomId(page < Math.ceil(filter.length / 10) - 1 ? `inventory:${type}:${Math.ceil(filter.length / 10) - 1}_` : `inventory:${type}:${page}_`)
                                        .setEmoji(emotes.lastIndex)
                                        .setStyle(Discord.ButtonStyle.Secondary)
                                        .setDisabled(page == Math.ceil(filter.length / 10) - 1)
                                )
                            }
                            await interaction.update({ embeds: [embed], components: itemSelector ? [itemSelector, buttons] : [buttons] }).catch((e) => { console.log(e) })
                        }
                    }
                    break
                }
                case 'inventory.item': {
                    //TODO: Item-Interaktion
                }
            }
            interaction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => { console.log(e); return null })
            if(!interaction) break
        }
    }
}

export default options