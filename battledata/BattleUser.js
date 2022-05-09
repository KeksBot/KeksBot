const { User, ButtonInteraction } = require('discord.js')

module.exports = class BattleUser {
    /**
     * @class BattleUser
     * @param {ButtonInteraction} interaction 
     * @param {0|1} team 
     */
    constructor(interaction, team) {
        this.user = interaction.user
        this.member = interaction.member
        this.interaction = interaction
        this.battle = this.data.battle
        this.team = team
        this.skills = {}
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.skills = JSON.parse(JSON.stringify(this.data.skills))
    }
}