import Discord from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

let storeItems: {
    [key: string]: {
        name: string,
        description: string,
        item: string,
        price?: number,
        emote?: string
    }[],
    timeout: any
}

const obj: CommandOptions = {
    name: 'store',
    description: 'Öffnet den Store',
    async execute(ita, args, client) {
        const { user, color } = ita
        if(!storeItems) {
            storeItems = require('../../game/store.json')
        }
        storeItems.timeout && clearTimeout(storeItems.timeout)
        storeItems.timeout = setTimeout(() => {
            storeItems = undefined
            delete require.cache[require.resolve('../../game/store.json')]
        }, 900000)
        let embed = new Discord.EmbedBuilder()
            .setTitle(`${emotes.store} KeksBot Store`)
            .setColor(color.normal)
            .setDescription('Herzlich Willkommen im KeksBot Store!\nHier kannst du sehr viele Items kaufen, nimm dir also ein bisschen Zeit und schau dich einfach nach Belieben um!')
            .addFields([
                {
                    name: 'Medizinabteilung',
                    value: 'Hier findest du Items, die der Wiederherstellung von HP dienen'
                },
                {
                    name: 'Kampfartikel',
                    value: 'In dieser Abteilung finden sich vor allem Items, die im Kampf zu Buffs führen'
                },
                {
                    name: 'Basis-Items',
                    value: 'Hier findest du Items, die dir im Alltag helfen können'
                },
                {
                    name: 'Abteilung für Allgemeine Artikel',
                    value: 'Hier gibt es eine ganze Menge hilfreicher Dinge zu kaufen'
                }
            ])
        let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
            .addComponents(
                new Discord.SelectMenuBuilder()
                    .setCustomId('store.category')
                    .setPlaceholder('Wähle eine Kategorie')
                    .addOptions([
                        {
                            label: 'Medizinabteilung',
                            value: 'med'
                        },
                        {
                            label: 'Kampfartikel',
                            value: 'atk'
                        },
                        {
                            label: 'Basis-Items',
                            value: 'base'
                        },
                        {
                            label: 'Abteilung für Allgemeine Artikel',
                            value: 'item'
                        }
                    ])
            )  
        let path = ''
        let reply = await ita.reply({ embeds: [embed], components: [menu], ephemeral: true })
        let interaction = await reply.awaitMessageComponent({ time: 300000 }) as Discord.ButtonInteraction | Discord.SelectMenuInteraction
        let categoryPage = 0
        let cartContent: (DbInventoryItem & { price: number })[] = []
        let currentItem: BattleActionBuilder & { metadata?: DbInventoryItem['metadata'] }

        while (interaction) {
            switch(interaction.customId) {
                case 'store.category': //@ts-ignore
                case 'store.category.item': path += `/${interaction.values[0]}`; break
                case 'store.back': path = path.split('/').slice(0, -1).join('/'); break
                case 'store.category.firstPage': categoryPage = 0; break
                case 'store.category.prevPage': categoryPage--; break
                case 'store.category.nextPage': categoryPage++; break
                case 'store.category.lastPage': categoryPage = Math.floor(storeItems[path.split('/')[1]].length / 10); break
                case 'store.item.next': path = `/${path.split('/')[1]}/${storeItems[path.split('/')[1]][storeItems[path.split('/')[1]].findIndex(item => item.item === path.split('/')[2]) + 1].item}`; break
                case 'store.item.prev': path = `/${path.split('/')[1]}/${storeItems[path.split('/')[1]][storeItems[path.split('/')[1]].findIndex(item => item.item === path.split('/')[2]) - 1].item}`; break //@ts-ignore
                case 'store.item.addToCart': cartContent.find(i => i.id == currentItem?.id) ? cartContent[cartContent.findIndex(i => i.id == currentItem?.id)].count += parseInt(interaction.values[0]) : //@ts-ignore
                    cartContent.push({ price: currentItem.value, count: parseInt(interaction.values[0]), id: currentItem?.id, metadata: currentItem?.metadata }); break
            }

            switch(path.split('/').length) {
                case 1: {
                    categoryPage = 0
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.cookie} KeksBot Store`)
                        .setColor(color.normal)
                        .setDescription('Herzlich Willkommen im KeksBot Store!\nHier kannst du sehr viele Items kaufen, nimm dir also ein bisschen Zeit und schau dich einfach nach Belieben um!')
                        .addFields([
                            {
                                name: 'Medizinabteilung',
                                value: 'Hier findest du Items, die der Wiederherstellung von HP dienen'
                            },
                            {
                                name: 'Kampfartikel',
                                value: 'In dieser Abteilung finden sich vor allem Items, die im Kampf zu Buffs führen'
                            },
                            {
                                name: 'Basis-Items',
                                value: 'Hier findest du Items, die dir im Alltag helfen können'
                            },
                            {
                                name: 'Abteilung für Allgemeine Artikel',
                                value: 'Hier gibt es eine ganze Menge hilfreicher Dinge zu kaufen'
                            }
                        ])
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('store.category')
                                .setPlaceholder('Wähle eine Kategorie')
                                .addOptions([
                                    {
                                        label: 'Medizinabteilung',
                                        value: 'med'
                                    },
                                    {
                                        label: 'Kampfartikel',
                                        value: 'atk'
                                    },
                                    {
                                        label: 'Basis-Items',
                                        value: 'base'
                                    },
                                    {
                                        label: 'Abteilung für Allgemeine Artikel',
                                        value: 'item'
                                    }
                                ])
                                .setMaxValues(1)
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [menu] })
                    break
                }
                case 2: {
                    let category = path.split('/')[1]
                    let items = storeItems[category]
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.store} KeksBot Store | ${
                            category == 'med' ? 'Medizinabteilung' :
                            category == 'atk' ? 'Kampfartikel' :
                            category == 'base' ? 'Basis-Items' :
                            category == 'item' ? 'Abteilung für Allgemeine Artikel' : 'Unbekannte Kategorie'
                        }`)
                        .setDescription('Wähle ein Item aus, um zum Kaufmenü zu gelangen')
                        .setColor(color.normal)
                        .addFields(items.slice(categoryPage * 10, categoryPage * 10 + 10).map(item => {
                            return {
                                //@ts-ignore
                                name: `${item.emote ? emotes.items[item.emote] : '[ ]'} ${item.name}`,
                                value: `${item.description ? item.description : 'Keine Beschreibung verfügbar'}\n${(item.price && item.price != 0) ? `Preis: **${item.price}** Kekse` : 'Preis variiert zwischen unterschiedlichen Ausführungen'}`
                            }
                        }))
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('store.category.item')
                                .setPlaceholder('Wähle ein Item')
                                .addOptions(items.slice(categoryPage * 10, categoryPage * 10 + 10).map(item => {
                                    return {
                                        label: item.name,
                                        value: item.item,
                                        //@ts-ignore
                                        emoji: emotes.items[item.emote]
                                    }
                                }))
                                .setMaxValues(1)
                        )
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('store.back')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.category.firstPage')
                                .setEmoji(emotes.firstIndex)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(categoryPage == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.category.prevPage')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(categoryPage == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.category.nextPage')
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(categoryPage >= Math.floor(items.length / 10)),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.category.lastPage')
                                .setEmoji(emotes.lastIndex)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(categoryPage >= Math.floor(items.length / 10))
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [menu, buttons] })
                    break
                }
                case 3: {
                    let item: BattleActionBuilder = objectLoader([path.split('/')[2]]).get(path.split('/')[2])
                    if(item.storeOptions?.metadata?.length) {

                    } else {
                        currentItem = item
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(`${emotes.store} KeksBot Store | ${item.name}`)
                            //@ts-ignore
                            .setDescription(`${item.emote ? `${emotes.items[item.emote]} ` : '[ ] '}**${item.name}**\n${item.description ? item.description : 'Keine Beschreibung verfügbar'}\n${(item.value && item.value != 0) ? `Preis: **${item.value}** Kekse` : 'Preis variiert zwischen unterschiedlichen Ausführungen'}`)
                            .setColor(color.normal)
                            .setFooter({ 
                                text: `${user.data.inventory.find(i => i.id == item.id) ? 
                                    `Du hast dieses Item ${user.data.inventory.find(i => i.id == item.id).count}x im Inventar\n` :
                                    ''
                                }${
                                    cartContent.find(i => i.id == item.id) ?
                                    `Dieses Item befindet sich bereits ${cartContent.find(i => i.id == item.id).count}x im Warenkorb\n` :
                                    ''
                                }Du hast aktuell ${user.data.cookies} Kekse`
                            })
                        let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                            .addComponents(
                                new Discord.SelectMenuBuilder()
                                    .setCustomId('store.item.addToCart')
                                    .setPlaceholder('Anzahl')
                                    .setOptions([
                                        { label: `1 (${item.value} Kekse)`, value: '1' },
                                        { label: `2 (${item.value * 2} Kekse)`, value: '2' },
                                        { label: `3 (${item.value * 3} Kekse)`, value: '3' },
                                        { label: `4 (${item.value * 4} Kekse)`, value: '4' },
                                        { label: `5 (${item.value * 5} Kekse)`, value: '5' },
                                        { label: `6 (${item.value * 6} Kekse)`, value: '6' },
                                        { label: `7 (${item.value * 7} Kekse)`, value: '7' },
                                        { label: `8 (${item.value * 8} Kekse)`, value: '8' },
                                        { label: `9 (${item.value * 9} Kekse)`, value: '9' },
                                        { label: `10 (${item.value * 10} Kekse)`, value: '10' }
                                    ])
                            )
                        let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.back')
                                    .setEmoji(emotes.back)
                                    .setStyle(Discord.ButtonStyle.Danger),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.item.prev')
                                    .setEmoji(emotes.back)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(!storeItems[path.split('/')[1]].findIndex(i => i.item == item.id)),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.cart')
                                    .setEmoji(emotes.cart)
                                    .setStyle(Discord.ButtonStyle.Secondary),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.item.next')
                                    .setEmoji(emotes.next)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(storeItems[path.split('/')[1]].findIndex(i => i.item == item.id) == storeItems[path.split('/')[1]].length - 1)
                            )
                        await interaction.safeUpdate({ embeds: [embed], components: [menu, buttons] })
                    }
                    break
                }
            }
            interaction = await reply.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction | Discord.SelectMenuInteraction
            if(!interaction) break
        }
    }
}

export default obj