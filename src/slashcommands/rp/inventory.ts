import Discord, { EmbedAssertions } from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

function group(list: Map<any, any>) {
    const map = new Map();
    list.forEach((item, key) => {
        const collection = map.get(item.type?.split('/')?.[1] || 'item');
        if (!collection) map.set(item.type?.split('/')?.[1] || 'item', new Map([[key, item]]));
        else collection.set(key, item);
    })
    return map
}

const options: CommandOptions = {
    name: 'inventory',
    description: 'Zeigt dir dein Inventar an.',
    execute: async function (ita, args, client) {
        let { user, color, guild } = ita
        let inventory = user.data?.battle?.inventory
        if (!inventory || !inventory.length) return ita.error('Inventar leer', 'Du hast nichts im Inventar.', true)
        //@ts-ignore
        let items: Map<String, Map<Number, BattleActionBuilder & { count: number }>> = objectLoader(inventory.map(i => parseInt(i.id)))
        items.forEach(i => {
            //@ts-ignore
            i.count = inventory.find(_i => _i.id == i.id).count
        })
        items = group(items)
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
            .addFields([
                {
                    name: 'Kekse',
                    value: user.data.cookies.toString() || '0',
                    inline: true
                },
                {
                    name: 'Sternenstaub',
                    value: items.get('item')?.get(2)?.count.toString() || '0',
                    inline: true
                },
                {
                    name: 'Kometenstücke',
                    value: items.get('item')?.get(3)?.count.toString() || '0',
                    inline: true
                }
            ])
        let response = await ita.reply({ embeds: [embed], components: [selectMenu], ephemeral: true })
        let interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => { console.log(e); return null })
        if(!interaction) return
        while(true) {
            switch(interaction.customId.split(':')[0]) {
                case 'inventory': {
                    //@ts-ignore
                    switch(interaction.values?.length ? interaction.values[0] : interaction.customId?.split(':')[1] || 'none') {
                        case 'none': {
                            let embed = new Discord.EmbedBuilder()
                                .setTitle('Inventar')
                                .setColor(color.normal)
                                .addFields([
                                    {
                                        name: 'Kekse',
                                        value: user.data.cookies.toString() || '0',
                                        inline: true
                                    },
                                    {
                                        name: 'Sternenstaub',
                                        value: items.get('item')?.get(2)?.count.toString() || '0',
                                        inline: true
                                    },
                                    {
                                        name: 'Kometenstücke',
                                        value: items.get('item')?.get(3)?.count.toString() || '0',
                                        inline: true
                                    }
                                ])
                            await interaction.update({ embeds: [embed], components: [selectMenu] })
                            break
                        }
                        default: {
                            //@ts-ignore
                            let type = interaction.values?.length ? interaction.values[0] : interaction.customId?.split(':')[1] || 'none'
                            let filter: Array<BattleActionBuilder & { count: number }> = [...items.get(type)?.values() || []]
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
                                        name: i.emote ? `${emotes.items[i.emote] || '[ ]'} ${i.name.title()}` : `[ ] ${i.name.title()}`,
                                        value: `Anzahl: **${i.count}**\n${i.description}` || `Anzahl: **${i.count}**\nKeine Beschreibung verfügbar`,
                                        inline: false
                                    }
                                })
                            )
                            if(filter.length > 10) embed.setFooter({ text: `Seite ${page + 1} von ${Math.ceil(filter.length / 10)}` })
                            let itemSelector = filter.length ? new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                                .addComponents(
                                    new Discord.SelectMenuBuilder()
                                        .setCustomId(`inventory.item::${page}`)
                                        .setPlaceholder('Item auswählen')
                                        .addOptions(filter.slice(page * 10, page * 10 + 10).map((i: any) => {
                                            return {
                                                label: `${i.name.title()}`,
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
                    //@ts-ignore
                    let id = parseInt(interaction.values?.[0] || interaction.customId?.split(':')?.[1])
                    if(!id) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden')
                    let item: BattleActionBuilder & { count: number }
                    let group: Map<Number, BattleActionBuilder & { count: number }>
                    let groupname
                    [...items.entries()].forEach((i) => {
                        if(i[1].has(id)) {
                            item = i[1].get(id)
                            group = i[1]
                            groupname = i[0]
                        }
                    })
                    let _group = [...group.values()]
                    if(!item) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden')
                    let embed = new Discord.EmbedBuilder()
                        .setColor(color.normal)
                        //@ts-ignore
                        .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
                        .setDescription(`Anzahl: **${item.count}**\n${item.description}` || `Anzahl: **${item.count}**\nKeine Beschreibung verfügbar`)
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory:${groupname}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${_group[_group.indexOf(item) - 1]?.id || 'a'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(_group.indexOf(item) == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.use:${item.id}`)
                                .setLabel('Einsetzen')
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setDisabled(item.count < 1|| !item.inventoryUsable),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${_group[_group.indexOf(item) + 1]?.id || 'b'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(_group.indexOf(item) == _group.length - 1)
                        )
                    await interaction.update({ embeds: [embed], components: [buttons] }).catch((e) => { console.log(e) })
                    break
                }
                case 'inventory.use': {
                    let id = parseInt(interaction.customId?.split(':')?.[1])
                    if(!id) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden')
                    let item: BattleActionBuilder & { count: number }
                    let group: Map<Number, BattleActionBuilder & { count: number }>
                    let groupname
                    [...items.entries()].forEach((i) => {
                        if(i[1].has(id)) {
                            item = i[1].get(id)
                            group = i[1]
                            groupname = i[0]
                        }
                    })
                    let _group = [...group.values()]
                    if(!item) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden')

                    // Item usage
                    if(!item.count) return interaction.error('Keine Items', 'Du hast dieses Item nicht', true)
                    if(item.aHeal) user.data.battle.currentHP += item.aHeal.value
                    if(item.rHeal) user.data.battle.currentHP += Math.round(user.data.battle.skills.find(s => s.name == 'HP').value * item.rHeal.value)
                    if(user.data.battle.currentHP > user.data.battle.skills.find(s => s.name == 'HP').value) user.data.battle.currentHP = user.data.battle.skills.find(s => s.name == 'HP').value
                    item.count --
                    user.data.battle.inventory.find(i => i.id === id).count --
                    if(user.data.battle.inventory.find(i => i.id === id).count <= 0) user.data.battle.inventory.splice(user.data.battle.inventory.findIndex(i => i.id === id), 1)
                    await user.save()

                    let embed = new Discord.EmbedBuilder()
                        .setColor(color.normal)
                        //@ts-ignore
                        .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)
                        .setDescription(`Anzahl: **${item.count}**\n${item.description}` || `Anzahl: **${item.count}**\nKeine Beschreibung verfügbar`)
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory:${groupname}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${_group[_group.indexOf(item) - 1]?.id || 'a'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(_group.indexOf(item) == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.use:${item.id}`)
                                .setLabel('Einsetzen')
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setDisabled(item.count < 1|| !item.inventoryUsable),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${_group[_group.indexOf(item) + 1]?.id || 'b'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(_group.indexOf(item) == _group.length - 1)
                        )
                    await interaction.update({ embeds: [embed], components: [buttons] }).catch((e) => { console.log(e) })
                    break
                }
            }
            interaction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => null)
            if(!interaction) break
        }
    }
}

export default options