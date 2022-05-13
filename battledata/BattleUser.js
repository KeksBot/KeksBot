const { User, ButtonInteraction } = require('discord.js')

module.exports = class BattleUser {
    /**
     * @class BattleUser
     * @param {ButtonInteraction} interaction 
     * @param {0|1} team 
     */
    constructor(interaction, team) {
        this.user = interaction?.user
        this.member = interaction?.member
        this.interaction = interaction
        this.battle = this.user?.data?.battle
        this.id = this.user.id
        this.team = team
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.skills = JSON.parse(JSON.stringify(this.data.skills))
    }

    async heal() {
        let { healTimestamp, skills, currentHP } = this.battle
        let maxHP = skills.find(skill => skill.name == 'HP').value
        if(currentHP < maxHP) {
            let healBonus = skills.find(s => s.name == 'Regeneration').value || 1
            let heal = maxHP / 100
            currentHP = currentHP += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
            if(currentHP >= maxHP) {
                currentHP = maxHP
                healTimestamp = 0
            } else healTimestamp = Date.now()
        }
        this.battle.currentHP = currentHP
        this.battle.healTimestamp = healTimestamp
        await this.user.save()
    }
}