import Discord from 'discord.js'
import usable from './usable.js'

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
        this.skills = JSON.parse(JSON.stringify(this.battle.skills))
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

        user.data.level += levelcount
        if(levelup) this.interaction.client.emit('userLevelUp', )

        await this.user.save()
    }

    async updateMessage(options: Discord.MessageEditOptions) {
        return this.interaction.safeUpdate(options)
    }

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
}