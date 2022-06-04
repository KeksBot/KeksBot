import Discord = require('discord.js')
import BattleUser = require('./BattleUser')
var client: Discord.Client

interface Color {
    red: Discord.ColorResolvable,
    yellow: Discord.ColorResolvable,
    lime: Discord.ColorResolvable,
    normal: Discord.ColorResolvable
}

module.exports = class BaseBattle {
    #actions: any
    #usable: any
    users: Discord.Collection<string, BattleUser>
    private: boolean
    message: Discord.Message
    id: number
    color: Color
    client: Discord.Client


    /**
     * 
     * @param {boolean} priv whether the battle is private or not
     * @param {Discord.Message} message the message that started the battle
     * @param {Object} color the guild's color object
     */
    constructor(priv: boolean, message: Discord.Message, color: Color) {
        this.id = new Date().getTime()
        /**
         * @type {Discord.Collection<string, BattleUser>}
         */
        this.users = new Discord.Collection()
        this.private = priv
        this.message = message
        this.color = color
        if (!client) this.client = message.client
        client.battles.set(this.id, this)
    }

    /**
     * 
     * @param {BattleUser} battleUser 
     */
    addUser(battleUser: BattleUser) {
        this.users.set(battleUser.id, battleUser)
    }

    async load(){
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
            //@ts-ignore
            collectors.push(message.createMessageComponentCollector({ time: 120000, max: 1 }))
        })

        collectors.forEach((collector) => {
            collector.on('collect', async (i: Discord.ButtonInteraction) => {
                this.users.get(i.user.id).interaction = i
                if (collectors.length <= 1) return this.start()
                let embed = new Discord.MessageEmbed()
                    .setColor(this.color.yellow)
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
                    .setDescription(
                        'Der Kampf zwischen ' +
                        this.users.array().map(user => `**${user.member.displayName}**`).join(', ').replaceLast(',', ' und') +
                        'beginnt in Kürze.\nBitte warte noch einen Moment, bis alle bereit sind.'
                    )
                buttons.components[0].setDisabled(true)
                await i.update({ embeds: [embed], components: [buttons] })
                collectors.splice(collectors.indexOf(collector), 1)
            })

            collector.on('end', (reason: string) => {
                collectors.splice(collectors.indexOf(collector), 1)
                if (collectors.length == 0 && reason === 'time') return // TODO: Call Timeout Function
            })
        })
    }

    async start() {
        let usableData = require('./usable')
        this.#usable = {}
        this.users.forEach(u => {
            u.battle.attacks.forEach(a => { if (!this.#usable[a]) this.#usable[a] = usableData[a] })
            u.battle.inventory.forEach(i => { if (!this.#usable[i.id]) this.#usable[i.id] = usableData[i.id] })
        })

        return true
    }

    display(user: BattleUser, text: string) {
        // let users = this.users.filter(u => u.team == user.team)
        // let enemies = this.users.filter(u => u.team != user.team)

        // let enemyText = enemies.map(u =>
        //     `${`${u.member.displayName} • Lv. ${u.user.data.level}`.padStart(42)}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padStart(20, '▁').padStart(42)}`
        // ).array().join('\n')

        // let userText = users.map(u => {
        //     return u.user.id == user.user.id
        //         ? null
        //         : `${u.member.displayName} • Lv. ${u.user.data.level}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')}`
        // }).filter(u => u).array().join('\n')

        // userText += `\n${user.member.displayName} • Lv. ${user.user.data.level}\n${''.padEnd(Math.floor(user.battle.currentHP / user.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')} ${user.battle.currentHP} / ${user.skills.find(skill => skill.name == 'HP').value} HP`

        // return `\`\`\`${enemyText}\n\n\n${userText}\`\`\``
    }

    async game() {

    }

    async * calculations() {

    }
}