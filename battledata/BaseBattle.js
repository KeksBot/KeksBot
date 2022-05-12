const Discord = require('discord.js')
const BattleUser = require('./BattleUser')
var client

module.exports = class BaseBattle {
    #actions

    /**
     * 
     * @param {boolean} private whether the battle is private or not
     * @param {Discord.Message} message the message that started the battle
     * @param {Object} color the guild's color object
     */
    constructor(private, message, color) {
        this.id = new Date().getTime()
        /**
         * @type {Discord.Collection<string, BattleUser>}
         */
        this.users = new Discord.Collection()
        this.private = private
        this.message = message
        this.color = color
        if (!client) this.client = message.client
        client.battles.set(this.id, this)
    }

    /**
     * 
     * @param {BattleUser} battleUser 
     */
    addUser(battleUser) {
        this.users.set(battleUser.user.id, battleUser)
    }

    async load() {
        let embed = new Discord.MessageEmbed()
            .setColor(this.color.yellow)
            .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
            .setDescription(
                'Der Kampf zwischen ' +
                this.users.array().map(user => `**${user.member.displayName}**`).join(', ').replaceLast(',', ' und') +
                'beginnt in Kürze.\nBitte drücke diesen Knopf, sobald du bereit bist. Nach 2 Minuten ohne Eingabe wird das Matchmaking abgebrochen.'
            )
        let buttons = new Discord.MessageActionRow()
            .setComponents(
                new Discord.MessageButton()
                    .setLabel('Bereit')
                    .setCustomId('pvpBattle.ready')
                    .setStyle('SUCCESS')
            )
        let collectors = []
        await this.users.filter(u => !u.ai).array().forEach(async user => {
            let message = await user.interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true, fetchReply: true })
            collectors.push(message.createMessageComponentCollector({ time: 120000, max: 1 }))
        })

        collectors.forEach((collector) => {
            collector.on('collect', async i => {
                this.users.get(i.user.id).interaction = i
                if (collectors.length <= 1) return // TODO: Start the battle
                let embed = new Discord.MessageEmbed()
                    .setColor(this.color.yellow)
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
                    .setDescription(
                        'Der Kampf zwischen ' +
                        this.users.array().map(user => `**${user.member.displayName}**`).join(', ').replaceLast(',', ' und') +
                        'beginnt in Kürze.\nBitte warte noch einen Moment, bis alle bereit sind.'
                    )
                buttons.components[0].setDisabled(true)
                await i.update({ embeds: [embed], components: [buttons], ephemeral: true })
                collectors.splice(collectors.indexOf(collector), 1)
            })

            collector.on('end', reason => {
                collectors.splice(collectors.indexOf(collector), 1)
                if (collectors.length == 0 && reason === 'time') return // TODO: Call Timeout Function
            })
        })
    }

    async start() {

    }

    display(user, text) {

    }

    async game() {
        let embed = new Discord.MessageEmbed()
            .setTitle(`⚔️ Imagine a title`)
            .setColor(this.color.normal)
        let buttons = [new Discord.MessageActionRow()
            .addComponents(
                new Discord.MessageButton()
                    .setLabel('Kampf')
                    .setStyle('SECONDARY')
                    .setCustomId('battle:attack'),
                new Discord.MessageButton()
                    .setLabel('Items')
                    .setCustomId('battle:items')
                    .setStyle('SECONDARY'),
                new Discord.MessageButton()
                    .setLabel('Heilen [WIP]')
                    .setStyle('SECONDARY')
                    .setCustomId('battle:heal')
                    .setDisabled(true),
            )
        ]
        let components = []
        await this.users.filter(u => !u.ai).array().forEach(async u => {
            embed.setDescription(display(u))
            let message = await u.interaction.safeUpdate({ embeds: [embed], components: [buttons], ephemeral: true, fetchReply: true })
            const collector = message.createMessageComponentCollector({ time: 300000 })
            components.push(collector)

            collector.on('collect', async i => {

            })

            collector.on('end', async reason => {
                
            })
        })
    }

    async * calculations() {

    }
}