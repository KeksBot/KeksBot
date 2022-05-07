const { User, ButtonInteraction } = require('discord.js')

module.exports = class BattleUser {
    /**
     * Benötigt, um ein Battle einzuleiten
     * @class 
     * @param {ButtonInteraction} interaction 
     * @param {0|1} team 
     */
    constructor(interaction, team) {
        this.user = interaction.user
        this.member = interaction.member
        this.interaction = interaction
        this.data = this.user.data
        this.battle = this.data.battle
    }

    init() {
        //TODO: Ausrüstung auf Werte anwenden
        this.skills = JSON.parse(JSON.stringify(this.data.skills))
    }
}