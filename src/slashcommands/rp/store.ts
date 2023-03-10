import Discord from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

const equals = function (x: any, y: any) {
    if (x === y) return true
    else if ((typeof x == 'object' && x != null) && (typeof y == 'object' && y != null)) {
        if (Object.keys(x).length != Object.keys(y).length) return false
        for (let prop in x) {
            if(y.hasOwnProperty(prop)) {
                if(!equals(x[prop], y[prop])) return false
            } else return false
        }
        return true
    }
    return false
}

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
        let metaPage = 0
        let cartPage = 0
        let cartContent: (DbInventoryItem & { price: number, emote?: string, name: string, description: string, type: string })[] = []
        let currentItem: BattleActionBuilder & { metadata?: DbInventoryItem['metadata'] }
        let oldPath = ''

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
                case 'store.item.addToCart': interaction.values[0] != 'remove' ? cartContent.find(i => i.id == currentItem?.id && equals(i.metadata, currentItem.metadata)) ? cartContent[cartContent.findIndex(i => i.id == currentItem?.id && equals(i.metadata, currentItem.metadata))].count += parseInt(interaction.values[0]) : //@ts-ignore
                    cartContent.push({ price: currentItem.value, count: parseInt(interaction.values[0]), id: currentItem?.id, metadata: currentItem?.metadata, name: currentItem.name, emote: currentItem.emote, description: currentItem.description, type: currentItem.type }) : 
                    cartContent.splice(cartContent.findIndex(i => i.id == currentItem?.id && equals(i.metadata, currentItem.metadata))); break //@ts-ignore
                case 'store.meta.select': path += `/${interaction.values[0]}`; break
                case 'store.meta.nextPage': metaPage++; break
                case 'store.meta.prevPage': metaPage--; break
                case 'store.meta.firstPage': metaPage = 0; break //@ts-ignore
                case 'store.meta.lastPage': metaPage = Math.floor(storeItems[path.split('/')[1]].find(item => item.item === path.split('/')[2]).metadata.length / 10); break
                case 'store.meta.prev': path = `/${path.split('/')[1]}/${path.split('/')[2]}/${parseInt(path.split('/')[3]) - 1}`; break
                case 'store.meta.next': path = `/${path.split('/')[1]}/${path.split('/')[2]}/${parseInt(path.split('/')[3]) + 1}`; break
                case 'store.cart': path = 'cart'; break
                case 'store.cart.back': path = oldPath; break
                case 'store.cart.nextPage': cartPage++; break
                case 'store.cart.prevPage': cartPage--; break //@ts-ignore
                case 'store.cart.item': path = `/${cartContent[parseInt(interaction.values[0])].type.split('/')[1]}/${cartContent[parseInt(interaction.values[0])].id}`; break
                case 'store.checkout': path = 'cart/checkout'; break
                case 'store.payment': path = 'cart/checkout/payment'; break
            }

            if(path.startsWith('cart')) switch(path.split('/').length) {
                case 1: {
                    if(!cartContent.length) {
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(`${emotes.cart} Warenkorb`)
                            .setDescription('Dein Warenkorb ist leer')
                            .setColor(color.normal)
                        let menu = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                            .addComponents(
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.cart.back')
                                    .setEmoji(emotes.back)
                                    .setStyle(Discord.ButtonStyle.Danger)
                            )
                        await interaction.safeUpdate({ embeds: [embed], components: [menu] })
                        break
                    }
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.cart} Warenkorb`)
                        .setColor(color.normal)
                        .addFields(cartContent.slice(cartPage * 10, cartPage * 10 + 10).map(item => {
                            return { //@ts-ignore
                                name: `${item.emote ? emotes.items[item.emote] : '[ ]'} ${item.name}`,
                                value: `${item.description || 'Es ist keine Beschreibung verfügbar'}\n${item.count}x ${item.price} Kekse`
                            }
                        }))
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('store.cart.item')
                                .setPlaceholder('Artikel ändern')
                                .addOptions(cartContent.slice(cartPage * 10, cartPage * 10 + 10).map((item, index) => {
                                    return {
                                        label: item.name,
                                        value: index.toString(), //@ts-ignore
                                        emoji: emotes.items[item.emote]
                                    }
                                }))
                        )
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('store.cart.back')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.cart.prevPage')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(cartPage == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.checkout')
                                .setEmoji(emotes.store)
                                .setStyle(Discord.ButtonStyle.Success),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.cart.nextPage')
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(cartContent.length <= cartPage * 10 + 10)
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [menu, buttons] })
                    break
                }
                case 2: {
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.cart} Zahlung`)
                        .setDescription(`Du hast ${cartContent.reduce((a, b) => a + b.count, 0)} Artikel im Warenkorb für insgesamt ${cartContent.reduce((a, b) => a + b.count * b.price, 0)} Kekse.`)
                        .setColor(color.normal)
                        .addFields([
                            {
                                name: 'Aktuelles Guthaben',
                                value: `${user.storage.data.cookies} Kekse`,
                                inline: true
                            },
                            {
                                name: 'Anfallende Kosten',
                                value: `${cartContent.reduce((a, b) => a + b.count * b.price, 0)} Kekse`,
                                inline: true
                            },
                            {
                                name: 'Verbleibendes Guthaben',
                                value: `${user.storage.data.cookies - cartContent.reduce((a, b) => a + b.count * b.price, 0)} Kekse`,
                                inline: true
                            }
                        ])
                    if(user.storage.data.cookies - cartContent.reduce((a, b) => a + b.count * b.price, 0) < 0) embed.setFooter({ text: 'Du hast nicht genügend Kekse, um diesen Kauf abzuschließen.' })
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('store.back')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.payment')
                                .setEmoji(emotes.store)
                                .setStyle(Discord.ButtonStyle.Success)
                                .setDisabled(user.storage.data.cookies - cartContent.reduce((a, b) => a + b.count * b.price, 0) < 0)
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [buttons] })
                    break
                }
                case 3: {
                    if(user.storage.data.cookies - cartContent.reduce((a, b) => a + b.count * b.price, 0) < 0) {
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(`${emotes.denied} Zahlung verweigert`)
                            .setColor(color.red)
                            .setDescription('Du hast nicht genügend Kekse, um diesen Kauf abzuschließen.')
                        return interaction.safeUpdate({ embeds: [embed], components: [] })
                    }
                    for (const item of cartContent) {
                        let index = user.storage.data.inventory.items.findIndex(i => i.id == item.id && equals(i.metadata, item.metadata))
                        if(index == -1) {
                            user.storage.data.inventory.items.push({ id: item.id, count: item.count, metadata: item.metadata })
                        } else user.storage.data.inventory.items[index].count += item.count
                        user.storage.data.cookies -= item.count * item.price
                    }
                    await user.save()
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.store} Vielen Dank für deinen Einkauf!`)
                        .setColor(color.normal)
                        .setDescription(`Bitte beehre uns bald wieder`)
                    await interaction.safeUpdate({ embeds: [embed], components: [] })
                }
            } else switch(path.split('/').length) {
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
                    metaPage = 0
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
                    let item: BattleAction = objectLoader([path.split('/')[2]]).get(path.split('/')[2])
                    if(item.storeOptions?.metadata?.length) {
                        item.count = 0
                        let items = item.storeOptions.metadata.map((meta, index) => {
                            return item.storeOptions.onLoad.call({...item}, index)
                        })
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(`${emotes.store} KeksBot Store | ${item.name}`)
                            .setDescription('Wähle deine gewünschte Ausführung aus')
                            .setColor(color.normal)
                            .addFields(items.slice(metaPage * 10, metaPage * 10 + 1).map(item => {
                                return { //@ts-ignore
                                    name: `${item.emote ? emotes.items[item.emote] : '[ ]'} ${item.name}`,
                                    value: `${item.description}\n${(item.value && item.value != 0) ? `Preis: **${item.value}** Kekse` : 'Preis unbekannt'}`
                                }
                            }))
                        let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                            .addComponents(
                                new Discord.SelectMenuBuilder()
                                    .setCustomId('store.meta.select')
                                    .setPlaceholder('Wähle eine Ausführung')
                                    .addOptions(items.slice(metaPage * 10, metaPage * 10 + 1).map(item => {
                                        return {
                                            label: item.name,
                                            value: items.findIndex(i => i.id == item.id).toString(), //@ts-ignore
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
                                    .setCustomId('store.meta.firstPage')
                                    .setEmoji(emotes.firstIndex)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(metaPage == 0),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.meta.prevPage')
                                    .setEmoji(emotes.back)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(metaPage == 0),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.meta.nextPage')
                                    .setEmoji(emotes.next)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(metaPage >= Math.floor(items.length / 10)),
                                new Discord.ButtonBuilder()
                                    .setCustomId('store.meta.lastPage')
                                    .setEmoji(emotes.lastIndex)
                                    .setStyle(Discord.ButtonStyle.Secondary)
                                    .setDisabled(metaPage >= Math.floor(items.length / 10))
                            )
                        await interaction.safeUpdate({ embeds: [embed], components: [menu, buttons] })
                    } else {
                        currentItem = item
                        let embed = new Discord.EmbedBuilder()
                            .setTitle(`${emotes.store} KeksBot Store | ${item.name}`)
                            //@ts-ignore
                            .setDescription(`${item.emote ? `${emotes.items[item.emote]} ` : '[ ] '}**${item.name}**\n${item.description ? item.description : 'Keine Beschreibung verfügbar'}\n${(item.value && item.value != 0) ? `Preis: **${item.value}** Kekse` : 'Preis variiert zwischen unterschiedlichen Ausführungen'}`)
                            .setColor(color.normal)
                            .setFooter({ 
                                text: `${user.storage.data.inventory.items.find(i => i.id == item.id) ? 
                                    `Du hast dieses Item ${user.storage.data.inventory.items.find(i => i.id == item.id).count}x im Inventar\n` :
                                    ''
                                }${
                                    cartContent.find(i => i.id == item.id) ?
                                    `Dieses Item befindet sich bereits ${cartContent.find(i => i.id == item.id).count}x im Warenkorb\n` :
                                    ''
                                }Du hast aktuell ${user.storage.data.cookies} Kekse`
                            })
                        let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                            .addComponents(
                                new Discord.SelectMenuBuilder()
                                    .setCustomId('store.item.addToCart')
                                    .setPlaceholder('Anzahl auswählen')
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
                                        { label: `10 (${item.value * 10} Kekse)`, value: '10' },
                                        { label: `20 (${item.value * 20} Kekse)`, value: '20' },
                                        { label: `30 (${item.value * 30} Kekse)`, value: '30' },
                                        { label: `40 (${item.value * 40} Kekse)`, value: '40' },
                                        { label: `50 (${item.value * 50} Kekse)`, value: '50' },
                                        { label: 'Aus dem Warenkorb entfernen', value: 'remove' }
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
                case 4: {
                    let item = {...objectLoader([path.split('/')[2]]).get(path.split('/')[2])} as typeof currentItem //@ts-ignore
                    currentItem = item.storeOptions.onLoad.call(item, parseInt(path.split('/')[3]))
                    let embed = new Discord.EmbedBuilder()
                        .setTitle(`${emotes.store} KeksBot Store | ${item.name}`) //@ts-ignore
                        .setDescription(`**${item.emote ? `${emotes.items[item.emote]} ` : '[ ] '}${item.name}**\n${item.description ? item.description : 'Keine Beschreibung verfügbar'}\n${(item.value && item.value != 0) ? `Preis: **${item.value}** Kekse` : 'Preis unbekannt'}`)
                        .setColor(color.normal)
                        .setFooter({
                            text: `${user.storage.data.inventory.items.find(i => i.id == item.id && equals(i.metadata, currentItem.metadata)) ?
                                `Du hast dieses Item ${user.storage.data.inventory.items.find(i => i.id == item.id && equals(i.metadata, currentItem.metadata)).count}x im Inventar\n` :
                                ''
                            }${
                                cartContent.find(i => i.id == item.id && equals(i.metadata, currentItem.metadata)) ?
                                `Dieses Item befindet sich bereits ${cartContent.find(i => i.id == item.id && equals(i.metadata, currentItem.metadata)).count}x im Warenkorb\n` :
                                ''
                            }Du hast aktuell ${user.storage.data.cookies} Kekse`
                        })
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('store.item.addToCart')
                                .setPlaceholder('Anzahl auswählen')
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
                                    { label: `10 (${item.value * 10} Kekse)`, value: '10' },
                                    { label: `20 (${item.value * 20} Kekse)`, value: '20' },
                                    { label: `30 (${item.value * 30} Kekse)`, value: '30' },
                                    { label: `40 (${item.value * 40} Kekse)`, value: '40' },
                                    { label: `50 (${item.value * 50} Kekse)`, value: '50' },
                                    { label: 'Aus dem Warenkorb entfernen', value: 'remove' }
                                ])
                        )
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('store.back')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.meta.prev')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(path.split('/')[3] == '0'),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.cart')
                                .setEmoji(emotes.cart)
                                .setStyle(Discord.ButtonStyle.Secondary),
                            new Discord.ButtonBuilder()
                                .setCustomId('store.meta.next')
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(parseInt(path.split('/')[3]) == item.storeOptions.metadata.length - 1)
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [menu, buttons] })
                }
            }
            if(!path.startsWith('cart')) oldPath = path
            interaction = await reply.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction | Discord.SelectMenuInteraction
            console.log(oldPath)
            if(!interaction) break
        }
    }
}

export default obj