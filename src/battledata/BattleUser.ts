import Discord from 'discord.js'
import EmbedRenderer from './EmbedRenderer'

export default class BattleUser {
    user: Discord.User
    member: Discord.GuildMember
    interaction: Discord.ButtonInteraction
    battle: Userdata['battle']
    id: string
    team: number
    skills: Userdata['battle']['skills']
    attacks: [{ id: string, uses: number }]
    ai: boolean
    embedRenderer: typeof EmbedRenderer


    constructor(interaction: Discord.ButtonInteraction, team: 0 | 1) {
        this.user = interaction?.user
        //@ts-ignore
        this.member = interaction?.member
        this.interaction = interaction
        this.battle = this.user?.data?.battle
        this.id = this.user.id
        this.team = team
        this.embedRenderer = new EmbedRenderer(this, this.battle)
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        let usable: any = require('./usable')
        this.skills = JSON.parse(JSON.stringify(this.battle.skills))
        //@ts-ignore
        this.attacks = []
        for (const i of this.battle.attacks) {
            this.attacks.push({
                id: i,
                uses: usable[i].uses
            })
        }

        //TODO: Bot Nutzer
        this.ai = false
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
}