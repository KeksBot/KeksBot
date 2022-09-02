import Discord from 'discord.js'
import usable from './usable'
import emotes from '../emotes.json'

export default class BattleUser {
    user: Discord.User
    member: Discord.GuildMember
    interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction
    battle: UserData['battle']
    id: string
    team: number
    skills: {
        name: string
        value: number
        getValue?: () => number
    }[]
    attacks: { id: string, uses: number }[]
    color: Color
    name: string
    move?: {
        targets?: string[],
        action: number,
        user: BattleUser
    }
    skillChanges?: UserData['battle']['skills']

    constructor(interaction: Discord.ButtonInteraction, team: 0 | 1) {
        this.user = interaction?.user
        //@ts-ignore
        this.member = interaction?.member
        this.interaction = interaction
        this.battle = this.user?.data?.battle
        this.id = this.user.id
        this.team = team
        this.name = this.member.displayName
    }

    setup(color: Color) {
        this.color = color
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.skills = [...this.battle.skills]
        this.skillChanges = []
        this.attacks = []
        for (const i of this.battle.attacks) {
            this.attacks.push({
                id: String(i),
                uses: usable[i].uses
            })
        }
        for (const skill of this.skills) {
            let index = this.skills.findIndex(s => s.name == skill.name)
            this.skillChanges[index] = {
                name: skill.name,
                value: 1
            }
        }
        for (const s of this.skills) {
            s.getValue = () => Math.round(s.value * this.skillChanges.find(skill => skill.name == s.name).value)
        }
    }

    async heal() {
        let { healTimestamp, skills, currentHP } = this.battle
        let maxHP = skills.find(skill => skill.name == 'HP').value
        if (currentHP < maxHP) {
            let healBonus = skills.find(s => s.name == 'Regeneration').value || 1
            let heal = maxHP / 100
            currentHP = currentHP += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
            if (currentHP >= maxHP) {
                currentHP = maxHP
                healTimestamp = 0
            } else healTimestamp = Date.now()
        }
        this.battle.currentHP = currentHP
        this.battle.healTimestamp = healTimestamp
        await this.user.save()
    }

    async setHP(hp: number) {
        this.battle.currentHP = Math.round(hp < 0 ? 0 : hp > this.skills.find(s => s.name == 'HP').value ? this.skills.find(s => s.name == 'HP').value : hp)
        this.battle.healTimestamp = this.battle.currentHP < this.getSkillValue('HP') ? Date.now() : 0
        await this.user.save()
    }

    async addXP(xp: number) {
        this.user.data.xp += xp

        let { user } = this
        let levelup = false
        let scanning = true
        let levelcount = 0

        while (scanning) {
            if (user.data.level <= 15 && (user.data.level + 1) ** 3 * ((24 + Math.floor((user.data.level + 2) / 3)) / 3) <= user.data.xp) {
                user.data.level++
                levelup = true
                levelcount++
            } else if (user.data.level <= 36 && user.data.level > 15 && (user.data.level + 1) ** 3 * ((15 + user.data.level) / 3) <= user.data.xp) {
                user.data.level++
                levelup = true
                levelcount++
            } else if (user.data.level < 100 && user.data.level > 37 && (user.data.level + 1) ** 3 * ((32 + Math.floor((user.data.level + 1) / 2)) / 3)) {
                user.data.level++
                levelup = true
                levelcount++
            } else scanning = false
        }

        if (levelup) this.interaction.client.emit('userLevelUp', this.interaction, levelcount, this.interaction.client, false)
    }

    async updateMessage(options: Discord.MessageEditOptions) {
        if (this.interaction.replied || this.interaction.deferred) return await this.interaction.editReply(options)
        return await this.interaction.update(Object.assign(options, { fetchReply: true }))
    }

    modifySkills(skill: string, value: number) {
        let index = this.skillChanges.findIndex(s => s.name == skill)
        let oldValue = this.skillChanges[index].value
        for (let i = 0; i < Math.abs(value); i++) {
            if (value > 0 && oldValue < 3) this.skillChanges[index].value /= 0.8
            else if(value < 0 && oldValue > 0.3) this.skillChanges[index].value *= 0.8
        }
        if(oldValue == this.skillChanges[index].value) return false
        return true
    }

    getSkillValue(skill: string) {
        return this.skills.find(s => s.name == skill).getValue()
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
        if(!this.interaction.replied) this.interaction.message = await this.interaction.reply({ embeds: [embed], components: [button], ephemeral: true, fetchReply: true })
        else this.interaction.message = await this.interaction.editReply({ embeds: [embed], components: [button] })
        let interaction = await this.interaction.message.awaitMessageComponent({ filter: (i: any) => i.customId == 'battle:user.ready', componentType: Discord.ComponentType.Button, time: 120000 })
            .catch((e) => { return null })
        if (!interaction) return false
        this.interaction = interaction
        return true
    }

    async chooseAction(imageUrl: string, users: { name: string, team: any, id: string }[]) {
        let imageEmbed = new Discord.EmbedBuilder()
            .setColor(this.color.normal)
            .setImage(imageUrl)
            .setFooter(null)
        let loops = 0
        loop: do {
            if (!loops || this.interaction.customId == 'battle:user.home') {
                let embed = new Discord.EmbedBuilder()
                    .setColor(this.color.normal)
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
                            .setCustomId('battle:user.inventory')
                            .setDisabled(true),
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
                        .setColor(this.color.normal)
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
                        //@ts-ignore
                        let attackData = usable[attack.id]
                        embed.addFields([{
                            name: attackData.name,
                            value: `${attackData.description}\n**Stärke**: ${attackData.strength}\n**Genauigkeit**: ${String(attackData.accuracy).replace('Infinity', '—')}\n**AP**: ${attack.uses}/${attackData.uses}`,
                            inline: true
                        }])
                        if(attack.uses > 0) 
                            menu.components[0].addOptions([
                                {
                                    label: attackData.name,
                                    value: attack.id
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
                    let move = usable[this.interaction.values[0]]
                    let targetType = move.targets || 0
                    this.move = {
                        targets: [],
                        //@ts-ignore
                        action: parseInt(this.interaction.values[0]),
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
                        .setColor(this.color.normal)
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
            }
            //@ts-ignore
            let interaction = await this.interaction.message.awaitMessageComponent({ time: 60000 }).catch((e) => { return false })
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
        return true
    }
}