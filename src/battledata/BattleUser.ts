import Discord from 'discord.js'
import usable from './usable.js'
import emotes from '../emotes.json'

export default class BattleUser {
    user: Discord.User
    member: Discord.GuildMember
    interaction: Discord.ButtonInteraction
    battle: UserData['battle']
    id: string
    team: number
    skills: UserData['battle']['skills']
    attacks: [{ id: string, uses: number }]
    color: Color

    constructor(interaction: Discord.ButtonInteraction, team: 0 | 1) {
        this.user = interaction?.user
        //@ts-ignore
        this.member = interaction?.member
        this.interaction = interaction
        this.battle = this.user?.data?.battle
        this.id = this.user.id
        this.team = team
    }

    setup(color: Color) {
        this.color = color
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.skills = [...this.battle.skills]
        //@ts-ignore
        this.attacks = []
        for (const i of this.battle.attacks) {
            this.attacks.push({
                id: i,
                //@ts-ignore
                uses: usable[i].uses
            })
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
        this.battle.currentHP = hp < 0 ? 0 : hp > this.skills.find(s => s.name == 'HP').value ? this.skills.find(s => s.name == 'HP').value : hp
        this.battle.currentHP = hp
        await this.user.save()
    }

    async addXP(xp: number) {
        this.user.data.xp += xp

        let { user } = this
        let levelup = false
        let scanning = true
        let levelcount = 0

        while (scanning) {
            if(user.data.level <= 15 && (user.data.level + 1) ** 3 * ((24 + Math.floor((user.data.level + 2) / 3)) / 3) <= user.data.xp) {
                user.data.level++
                levelup = true
                levelcount++
            } else if(user.data.level <= 36 && user.data.level > 15 && (user.data.level + 1) ** 3 * ((15 + user.data.level) / 3) <= user.data.xp) {
                user.data.level++
                levelup = true
                levelcount++
            } else if(user.data.level < 100 && user.data.level > 37 && (user.data.level + 1) ** 3 * ((32 + Math.floor((user.data.level + 1) / 2)) / 3)) {
                user.data.level++
                levelup = true
                levelcount++
            } else scanning = false
        }

        if(levelup) this.interaction.client.emit('userLevelUp', this.interaction, levelcount, this.interaction.client)
    }

    async updateMessage(options: Discord.MessageEditOptions) {
        return this.interaction.safeUpdate(options)
    }

    modifySkills() {}

    async ready(imageUrl?: string) {
        let embed = new Discord.EmbedBuilder()
            .setColor(this.color.yellow)
            .setTitle('Kampfvorbereitung')
            .setDescription('Du hast noch etwas Zeit, dich auf den Kampf vorzubereiten. Drück den Knopf, sobald du bereit bist.')
            //TODO .setImage(imageUrl)
            .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
        let button = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Bereit')
                    .setStyle(Discord.ButtonStyle.Secondary)
                    .setCustomId('battle:user.ready')
            )
        await this.updateMessage({ embeds: [embed], components: [button] })
        this.interaction = await this.interaction.message.awaitMessageComponent({ filter: (i: any) => i.customId == 'battle:user.ready', componentType: Discord.ComponentType.Button, time: 120000 })
            .catch(() => { return null })
        if (this.interaction?.customId != 'battle:user.ready')
        embed
            .setDescription('Bitte warte noch einen Moment, bis alle anderen auch bereit sind...')
            //TODO: .setImage(editedImageUrl)
        this.updateMessage({ embeds: [embed], components: [] })
        return true
    }

    async chooseAction(imageUrl: string) {
        let imageEmbed = new Discord.EmbedBuilder()
            .setColor(this.color.normal)
            .setTitle('Insert Name here')
            .setImage(imageUrl)
        do {
            if(this.interaction.customId.includes('exit') || this.interaction.customId.includes('ready') || this.interaction.customId.includes('home')) {
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
                            .setLabel('Angriff')
                            .setStyle(Discord.ButtonStyle.Primary),
                        new Discord.ButtonBuilder()
                            .setCustomId('battle:user.surrender')
                            .setLabel('Flucht')
                            .setStyle(Discord.ButtonStyle.Secondary)
                            .setDisabled(true)
                    )
                await this.updateMessage({ embeds: [imageEmbed, embed], components: [components] })
            } else switch(this.interaction.customId.split('.')[1]) {
                case 'battle':
                    let embed = new Discord.EmbedBuilder()
                        .setColor(this.color.normal)
                        .setTitle('Kampfmenü')
                        .setDescription('Bitte wähle eine Aktion aus')
                    let buttons = [new Discord.ActionRowBuilder<Discord.ButtonBuilder>()]
                    for (const attack of this.attacks) {
                        //@ts-ignore
                        let attackData = usable[attack.id]
                        embed.addFields([{
                            name: attackData.name,
                            value: `${attackData.description}\n**Stärke**: ${attackData.stength}\n**Genauigkeit**: ${attackData.accuracy}\n**AP**: ${attack.uses}/${attackData.maxUses}`,
                            inline: true
                        }])
                        buttons[0].components.length == 3 && buttons.unshift(new Discord.ActionRowBuilder<Discord.ButtonBuilder>())
                        buttons[0].addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId(`battle:user.exit:${attack.id}`)
                                .setLabel(attackData.name)
                                .setStyle(Discord.ButtonStyle.Secondary)
                        )
                    }
                    buttons.reverse().push(new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                        .addComponents(
                            new Discord.ButtonBuilder()
                                .setCustomId('battle:user.home')
                                .setEmoji(emotes.back)
                                .setStyle(Discord.ButtonStyle.Danger)
                        )
                    )
                    await this.updateMessage({ embeds: [imageEmbed, embed], components: buttons })
                    break
            }
            this.interaction = await this.interaction.message.awaitMessageComponent({ componentType: Discord.ComponentType.Button, time: 60000 })
        } while (!this.interaction.customId.includes('exit'))
    }
}