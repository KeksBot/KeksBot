import Discord from 'discord.js'
import objectLoader from '../../game/objectLoader'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'inventory',
    description: 'Zeigt dir dein Inventar an.',
    battlelock: true,
    execute: async function (ita, args, client) {
        let { user, color, guild } = ita
        let inventory = user.data?.inventory?.items
        if (!inventory || !inventory.length) return ita.error('Inventar leer', 'Du hast nichts im Inventar.', true)
        //@ts-ignore
        let objects = objectLoader(inventory.map(i => i.id))
        let items: BattleAction[]
        items = inventory.map(i => {
            //@ts-ignore
            let item: BattleAction = Object.assign({...objects.get(i.id)}, i._doc)
            if(item.onLoad) item.onLoad()
            return item
        })
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
                    value: items.find(i => i.id == 'sternenstaub')?.count.toString() || '0',
                    inline: true
                },
                {
                    name: 'Kometenstücke',
                    value: items.find(i => i.id == 'kometenstück')?.count.toString() || '0',
                    inline: true
                }
            ])
        let response = await ita.reply({ embeds: [embed], components: [selectMenu], ephemeral: true })
        let interaction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => { console.log(e); return null }) as Discord.ButtonInteraction | Discord.SelectMenuInteraction
        if(!interaction) return
        while(true) {
            let objects = objectLoader(inventory.map(i => i.id))
            let items: BattleAction[]
            items = inventory.map(i => {
                //@ts-ignore
                let item: BattleAction = Object.assign({...objects.get(i.id)}, i._doc)
                if(item.onLoad) item.onLoad()
                return item
            })
            interaction.color = color
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
                                        value: items.find(i => i.id == 'sternenstaub')?.count.toString() || '0',
                                        inline: true
                                    },
                                    {
                                        name: 'Kometenstücke',
                                        value: items.find(i => i.id == 'kometenstück')?.count.toString() || '0',
                                        inline: true
                                    }
                                ])
                            await interaction.update({ embeds: [embed], components: [selectMenu] })
                            break
                        }
                        default: {
                            //@ts-ignore
                            let type = interaction.values?.length ? interaction.values[0] : interaction.customId?.split(':')[1] || 'none'
                            let filter: Array<BattleAction> = items.filter(i => i.type == `item/${type}`)
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
                                        .addOptions(filter.slice(page * 10, page * 10 + 10).map(i => {
                                            return {
                                                label: `${i.name.title()}`,
                                                value: items.indexOf(i).toString(),
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
                    let index = parseInt(interaction.values?.[0]) || parseInt(interaction.customId?.split(':')?.[1])
                    if(!index) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden')
                    let item: BattleAction = items[index]
                    let group = items.filter(i => i.type == item.type)
                    let groupname = item.type.split('/')[1] || 'none'
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
                                .setCustomId(`inventory.item:${group.indexOf(item) - 1 || 'a'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(group.indexOf(item) == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.use:${items.indexOf(item)}`)
                                .setLabel('Einsetzen')
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setDisabled(item.count < 1|| !item.inventoryUsable),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${group.indexOf(item) + 1 || 'b'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(group.indexOf(item) == group.length - 1)
                        )
                    await interaction.update({ embeds: [embed], components: [buttons] }).catch((e) => { console.log(e) })
                    break
                }
                case 'inventory.use': {
                    let index = parseInt(interaction.customId?.split(':')?.[1])
                    if(!index) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden', true)
                    let item = items[index]
                    let group = items.filter(i => i.type == item.type)
                    let groupname = item.type.split('/')[1] || 'none'
                    if(!item) return interaction.error('Fehler', 'Das Item konnte nicht gefunden werden', true)

                    // Item usage
                    if(!item.count) return interaction.error('Keine Items', 'Du hast dieses Item nicht', true)
                    let output: any = true
                    if(item.onInvUse) {
                        //@ts-ignore
                        output = await item.onInvUse(item, user, interaction)
                    }
                    let embed = new Discord.EmbedBuilder()
                        .setColor(color.normal)
                        //@ts-ignore
                        .setTitle(item.emote ? `${emotes.items[item.emote] || '[ ]'} ${item.name.title()}` : `[ ] ${item.name.title()}`)

                    if(output && (!output?.length || output?.[0])) {
                        if(item.aHeal) user.data.battle.hp += item.aHeal.value
                        if(item.rHeal) user.data.battle.hp += Math.round(user.data.battle.skills.find((s: any) => s.name == 'HP').value * item.rHeal.value)
                        if(user.data.battle.hp > user.data.battle.skills.find((s: any) => s.name == 'HP').value) user.data.battle.hp = user.data.battle.skills.find((s: any) => s.name == 'HP').value
                        // TODO: Stat modifiers
                        item.count --
                        user.data.inventory.items[index].count --
                        if(user.data.inventory.items[index].count <= 0) user.data.inventory.items.splice(index, 1)
                        await user.save()
                        embed.setFooter({ text: typeof output === 'string' ? output : 'Das Item wurde erfolgreich angewandt' })
                    } else {
                        embed.setFooter({ text: output == null ? 'Der Vorgang wurde abgebrochen' : output?.length && !output[0] ? output[1] : 'Das Item konnte nicht benutzt werden' })
                    }

                    embed.setDescription(`Anzahl: **${item.count}**\n${item.description}` || `Anzahl: **${item.count}**\nKeine Beschreibung verfügbar`)

                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory:${groupname}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${group[group.indexOf(item) - 1]?.id || 'a'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(group.indexOf(item) == 0),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.use:${item.id}`)
                                .setLabel('Einsetzen')
                                .setStyle(Discord.ButtonStyle.Primary)
                                .setDisabled(item.count < 1|| !item.inventoryUsable),
                            new Discord.ButtonBuilder()
                                .setCustomId(`inventory.item:${group[group.indexOf(item) + 1]?.id || 'b'}${interaction.customId?.split(':')?.length > 2 ? ':' + interaction.customId?.split(':')[2] : ''}`)
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(group.indexOf(item) == group.length - 1)
                        )
                    await interaction.safeUpdate({ embeds: [embed], components: [buttons] }).catch((e) => { console.log(e) })
                    break
                }
            }
            interaction = await response.awaitMessageComponent({ time: 300000 }).catch((e) => null) as Discord.ButtonInteraction | Discord.SelectMenuInteraction | null
            if(!interaction) break
        }
    }
}

export default options