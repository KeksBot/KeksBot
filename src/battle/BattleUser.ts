import Discord from 'discord.js'
import emotes from '../emotes.json'

export default class BattleUser {
    user: Discord.User
    member: Discord.GuildMember
    interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction
    battle: UserData['battle']
    id: string
    team: number
    stats: Map<Stats, ({
        value: number
        getValue?: () => number
    } & StatOptions)>
    attacks: { id: string, uses: number }[]
    color: Color
    name: string
    move?: {
        targets?: string[],
        action: string,
        user: BattleUser
    }
    statChanges?: Map<Stats, number>
    usable: Map<string, BattleAction>
    inventory: UserData['inventory']

    constructor(interaction: Discord.ButtonInteraction, team: 0 | 1) {
        this.user = interaction?.user
        //@ts-ignore
        this.member = interaction?.member
        this.interaction = interaction
        this.battle = this.user?.storage?.data?.battle
        this.id = this.user.id
        this.team = team
        this.name = this.member.displayName
        this.inventory = this.user.storage.data.inventory
    }

    setup(color: Color, usable: Map<string, BattleAction>) {
        this.color = color
        this.usable = usable
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.stats = this.battle.stats.mapValues((stat, name) => {
            return {
                ...stat,
                value: this.user.storage.auto.stats[name],
                getValue: () => Math.round(this.user.storage.auto.stats[name] * this.statChanges.get(name))
            }
        })
        this.statChanges = new Map()
        this.attacks = []
        for (const i of this.battle.attacks) {
            this.attacks.push({
                id: i,
                uses: this.usable.get(i).uses
            })
        }
        this.stats.forEach((stat, name) => {
            this.statChanges.set(name, 1)
        })
    }

    async save() {
        return await this.user.save()
    }

    async heal() {
        let { healTimestamp, stats, hp } = this.battle
        let maxHP = this.stats.get('hp').value
        if (hp < maxHP) {
            let healBonus = this.stats.get('regeneration').value || 1
            let heal = maxHP / 100
            hp += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
            if (hp >= maxHP) {
                hp = maxHP
                healTimestamp = 0
            } else healTimestamp = Date.now()
        }
        this.battle.hp = hp
        this.battle.healTimestamp = healTimestamp
        await this.user.save()
    }

    async setHP(hp: number) {
        this.battle.hp = Math.round(hp < 0 ? 0 : hp > this.stats.get('hp').value ? this.stats.get('hp').value : hp)
        this.battle.healTimestamp = this.battle.hp < this.getSkillValue('hp') ? Date.now() : 0
        await this.user.save()
    }

    async addXP(xp: number) {
        this.user.storage.data.xp += xp

        let { user } = this
        let levelup = false
        let scanning = true
        let levelcount = 0

        while (scanning) {
            if (user.storage.data.level <= 15 && (user.storage.data.level + 1) ** 3 * ((24 + Math.floor((user.storage.data.level + 2) / 3)) / 3) <= user.storage.data.xp) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else if (user.storage.data.level <= 36 && user.storage.data.level > 15 && (user.storage.data.level + 1) ** 3 * ((15 + user.storage.data.level) / 3) <= user.storage.data.xp) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else if (user.storage.data.level < 100 && user.storage.data.level > 37 && (user.storage.data.level + 1) ** 3 * ((32 + Math.floor((user.storage.data.level + 1) / 2)) / 3)) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else scanning = false
        }

        await this.user.save()

        if (levelup) this.interaction.client.emit('userLevelUp', this.interaction, levelcount, this.interaction.client, false)
    }

    updateMessage(options: Discord.MessageEditOptions) {
        if (this.interaction.replied || this.interaction.deferred) return this.interaction.editReply(options)
        return this.interaction.update(Object.assign(options, { fetchReply: true }))
    }

    modifySkills(stat: Stats, value: number) {
        let oldValue = this.statChanges.get(stat)
        for (let i = 0; i < Math.abs(value); i++) {
            if (value > 0 && oldValue < 3) this.statChanges.set(stat, this.statChanges.get(stat) / 0.8)
            else if(value < 0 && oldValue > 0.3) this.statChanges.set(stat, this.statChanges.get(stat) * 0.8)
        }
        if(oldValue == this.statChanges.get(stat)) return false
        return true
    }

    getSkillValue(stat: Stats) {
        return this.stats.get(stat).getValue()
    }

    async ready(imageUrl: string) {
        let embed = new Discord.EmbedBuilder()
            .setColor(this.color.yellow)
            .setTitle('Kampfvorbereitung')
            .setDescription('Du hast noch etwas Zeit, dich auf den Kampf vorzubereiten. Drück den Knopf, sobald du bereit bist.')
            .setImage(imageUrl)
            .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
        let button = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Bereit')
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setCustomId('battle:user.ready')
            )
        //@ts-ignore
        if(!this.interaction.replied) this.interaction.message = await this.interaction.reply({ embeds: [embed], components: [button], ephemeral: true, fetchReply: true }).catch(error => console.error(error))
        //@ts-ignore
        else this.interaction.message = await this.interaction.editReply({ embeds: [embed], components: [button] }).catch(error => console.error(error))
        let interaction = await this.interaction.message.awaitMessageComponent({ filter: (i: any) => i.customId == 'battle:user.ready', componentType: Discord.ComponentType.Button, time: 120000 })
            .catch((e) => { console.log(e); return null })
        if (!interaction) return false
        this.interaction = interaction
        return true
    }

    async chooseAction(imageUrl: string, users: { name: string, team: any, id: string }[]) {
        let imageEmbed = new Discord.EmbedBuilder()
            .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
            .setImage(imageUrl)
            .setFooter(null)
        let loops = 0
        loop: do {
            if (!loops || this.interaction.customId == 'battle:user.home') {
                let embed = new Discord.EmbedBuilder()
                    .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
                    .setTitle('Hauptmenü')
                    .setDescription('Bitte wähle eine Aktion aus')
                    .addFields([
                        {
                            name: 'Beutel',
                            value: 'Öffnet dein Inventar, um Items zu benutzen',
                            inline: true
                        },
                        {
                            name: 'Kampf',
                            value: 'Öffnet das Kampfmenü',
                            inline: true
                        },
                        {
                            name: 'Flucht',
                            value: 'Beendet deine Teilnahme am Kampf und kann zu einer Niederlage führen',
                            inline: true
                        }
                    ])
                let components = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                    .addComponents(
                        new Discord.ButtonBuilder()
                            .setLabel('Beutel')
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setCustomId('battle:user.inventory'),
                        new Discord.ButtonBuilder()
                            .setCustomId('battle:user.attack')
                            .setLabel('Kampf')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setCustomId('battle:user.surrender')
                            .setLabel('Flucht')
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                await this.updateMessage({ embeds: [imageEmbed, embed], components: [components] })
            } else switch (this.interaction.customId.split('.')[1]) {
                case 'attack': {
                    delete this.move
                    let embed = new Discord.EmbedBuilder()
                        .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
                        .setTitle('Kampfmenü')
                        .setDescription('Bitte wähle eine Aktion aus')
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>().addComponents(
                        new Discord.SelectMenuBuilder()
                            .setCustomId('battle:user.attackTargetSelection')
                            .setMinValues(1)
                            .setMaxValues(1)
                            .setPlaceholder('Attacke auswählen')
                    )
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                    for (const attack of this.attacks) {
                        let attackData = this.usable.get(attack.id)
                        embed.addFields([{
                            name: attackData.name,
                            value: `${attackData.description}\n**Stärke**: ${attackData.strength || '-'}\n**Genauigkeit**: ${String(attackData.accuracy).replace('Infinity', '—')}\n**AP**: ${attack.uses}/${attackData.uses}`,
                            inline: true
                        }])
                        if(attack.uses > 0) 
                            menu.components[0].addOptions([
                                {
                                    label: attackData.name,
                                    value: String(attack.id)
                                }
                            ])
                    }
                    buttons.addComponents(
                        new Discord.ButtonBuilder()
                            .setCustomId('battle:user.home')
                            .setEmoji(emotes.back)
                            .setStyle(Discord.ButtonStyle.Danger)
                    )
                    await this.updateMessage({ embeds: [imageEmbed, embed], components: [menu, buttons] })
                    break
                }
                case 'attackTargetSelection': {
                    /*
                        target:
                            0: Einzelnes Ziel Gegner
                            1: Einzelnes Ziel: man selbst
                            2: Einzelnes Ziel: Teammitglied (exklusiv)
                            3: Einzelnes Ziel: Irgendwer (exklusiv)
                            4: Einzelnes Ziel: Irgendwer (inklusiv)
                            5: Mehrere Ziele: eigenes Team (exklusiv)
                            6: Mehrere Ziele: eigenes Team (inklusiv)
                            7: Mehrere Ziele: gegnerisches Team
                            8: Mehrere Ziele: alle Teilnehmer (exklusiv man selbst)
                            9: Mehrere Ziele: alle Teilnehmer (inklusiv man selbst)
                    */
                    //@ts-ignore
                    let move = this.usable.get(this.interaction.values[0])
                    let targetType = move.targets || 0
                    this.move = {
                        targets: [],
                        //@ts-ignore
                        action: this.interaction.values[0],
                        user: this
                    }
                    this.move.targets = 
                        targetType == 1 ? [this.id] :
                        targetType == 5 ? users.filter(u => u.team == this.team && u.id != this.id).map(u => u.id) :
                        targetType == 6 ? users.filter(u => u.team == this.team).map(u => u.id) :
                        targetType == 7 ? users.filter(u => u.team != this.team).map(u => u.id) :
                        targetType == 8 ? users.filter(u => u.id != this.id).map(u => u.id) :
                        targetType == 9 ? users.map(u => u.id) : []
                    if (targetType != 0 && targetType != 2 && targetType != 3 && targetType != 4) break loop
                    let targets = users.filter(u => {
                        return (
                            (targetType == 0 && u.team != this.team) ||
                            (targetType == 2 && u.team == this.team && u.id != this.id) ||
                            (targetType == 3 && u.id != this.id) ||
                            (targetType == 4)
                        )
                    })
                    if(targets.length < 2) {
                        this.move.targets = targets.map(u => u.id)
                        break loop
                    } 
                    let embed = new Discord.EmbedBuilder()
                        .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
                        .setTitle('Zielauswahl')
                        .setDescription('Bitte wähle das Ziel für deinen Angriff aus')
                    let menu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>().addComponents(
                        new Discord.SelectMenuBuilder()
                            .setCustomId('battle:user.exit.attack')
                            .setMinValues(1)
                            .setMaxValues(1)
                            .setPlaceholder('Ziel auswählen')
                            .addOptions(targets.map(u => {
                                return {
                                    label: u.name,
                                    value: u.id
                                }
                            }))
                    )
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('battle:user.attack')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger)
                        )
                    await this.updateMessage({ embeds: [imageEmbed, embed], components: [menu, buttons] })
                    break
                }
                case 'inventory': {
                    let embed = new Discord.EmbedBuilder()
                        .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
                        .setTitle('Hauptmenü')
                        .setDescription('Bitte wähle eine Aktion aus')
                        .addFields([
                            {
                                name: 'Beutel',
                                value: 'Öffnet dein Inventar, um Items zu benutzen',
                                inline: true
                            },
                            {
                                name: 'Kampf',
                                value: 'Öffnet das Kampfmenü',
                                inline: true
                            },
                            {
                                name: 'Flucht',
                                value: 'Beendet deine Teilnahme am Kampf und kann zu einer Niederlage führen',
                                inline: true
                            }
                        ])
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setLabel('Beutel')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setCustomId('battle:user.inventory'),
                            new Discord.ButtonBuilder()
                                .setCustomId('battle:user.attack')
                                .setLabel('Kampf')
                                .setStyle(Discord.ButtonStyle.Primary),
                            new Discord.ButtonBuilder()
                                .setCustomId('battle:user.surrender')
                                .setLabel('Flucht')
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(true)
                        )
                    let selectMenu = new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('battle:user.selectInvCategory')
                                .setPlaceholder('Kategorie auswählen')
                                .addOptions([
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
                                ])
                                .setMaxValues(1)
                        )
                    await this.updateMessage({ embeds: [imageEmbed, embed], components: [selectMenu, buttons] })
                    break
                }
                case 'selectInvCategory': {
                    //@ts-ignore
                    let type = `item/${this.interaction.values[0] || this.interaction.customId.split('.')[2]}`
                    //@ts-ignore
                    let items = this.inventory.filter(i => this.usable.get(i.id).type == type).map(i => { return { id: i.id, count: i.count, name: this.usable.get(i.id).name, description: this.usable.get(i.id).description, u: this.usable.get(i.id).fightUsable } })
                    let page = parseInt(this.interaction.customId.split('.')[3]) || 1
                    let embed = new Discord.EmbedBuilder()
                        .setColor(this.battle.hp <= 0.25 * this.getSkillValue('hp') ? this.color.red : this.color.normal)
                        .setTitle(
                            type == 'item/med' ? 'Medizinbeutel' :
                            type == 'item/atk' ? 'Kampfbeutel' :
                            type == 'item/item' ? 'Itembeutel' :
                            type == 'item/base' ? 'Basis-Itembeutel' : 'Inventar'
                        )
                        .addFields(items.slice(page * 25 - 25, page * 25).map((i: any) => {
                            return {
                                name: `${i.name} (${i.count}x)`,
                                value: (i.description || 'Keine Beschreibung verfügbar') + (!i.u ? '\nKann nicht in einem Kampf benutzt werden' : ''),
                                inline: true
                            }
                        }))
                    if(items.length > 25) {
                        embed.setFooter({ text: `Seite ${page} von ${Math.ceil(items.length / 25)}` })
                    }
                    if(!items.length) embed.setDescription('Hier ist nichts')
                    let selectMenu = items.slice(page * 25 - 25, page * 25).filter((i: any) => i.u).length ? new Discord.ActionRowBuilder<Discord.SelectMenuBuilder>()
                        .addComponents(
                            new Discord.SelectMenuBuilder()
                                .setCustomId('battle:user.exit.selectItem')
                                .setPlaceholder('Item auswählen')
                                .addOptions(items.slice(page * 25 - 25, page * 25).filter((i: any) => i.u).map((i: any) => {
                                    return {
                                        label: `${i.name} (${i.count}x)`,
                                        value: String(i.id)
                                    }
                                }))
                                .setMaxValues(1)
                        ) : null
                    let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('battle:user.inventory')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger)
                        )
                    if(items.length > 25) {
                        buttons.addComponents(
                            new Discord.ButtonBuilder()
                                //@ts-ignore
                                .setCustomId(`battle:user.selectInvCategory.${this.interaction.values[0] || this.interaction.customId.split('.')[2]}.${page - 1}`)
                                .setEmoji(emotes.next)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(page <= 1),
                            new Discord.ButtonBuilder()
                                //@ts-ignore
                                .setCustomId(`battle:user.selectInvCategory.${this.interaction.values[0] || this.interaction.customId.split('.')[2]}.${page + 1}`)
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Secondary)
                                .setDisabled(page >= Math.ceil(items.length / 25))
                        )
                    }
                    await this.updateMessage({ embeds: [imageEmbed, embed], components: selectMenu ? [selectMenu, buttons] : [buttons] })
                    break
                }
            }
            //@ts-ignore
            let interaction = await this.interaction.message.awaitMessageComponent({ time: 120000 }).catch((e) => { console.log(e); return false })
            if (!interaction) return false
            //@ts-ignore
            this.interaction = interaction
            loops++
        } while (!this.interaction.customId.includes('exit'))
        if(this.interaction.customId.endsWith('exit.attack') || this.interaction.customId.endsWith('attackTargetSelection')) {
            //@ts-ignore
            this.attacks.find(a => a.id == this.move.action).uses--
            //@ts-ignore
            if(this.interaction.customId.endsWith('exit.attack')) this.move.targets = users.filter(u => this.interaction.values.includes(u.id)).map(u => u.id)
        }
        if(this.interaction.customId.endsWith('exit.selectItem')) {
            //@ts-ignore
            let item = this.battle.inventory.find(i => i.id == this.interaction.values[0])
            if(!item) return false
            item.count--
            if(!item.count) this.inventory.items.splice(this.inventory.items.indexOf(item), 1)
            this.move = {
                action: item.id,
                targets: [this.id],
                user: this
            }
        }
        return true
    }
}