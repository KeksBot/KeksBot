const Discord = require('discord.js')
const BattleUser = require('./BattleUser')
var client

module.exports = class BaseBattle {
    #actions
    #usable

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
        let usableData = require('./usable')
        this.#usable = {}
        this.users.forEach(u => {
            u.battle.attacks.forEach(a => { if (!this.#usable[a]) this.#usable[a] = usableData[a] })
            u.battle.inventory.forEach(i => { if (!this.#usable[i.id]) this.#usable[i.id] = usableData[i.id] })
        })

        return true
    }

    display(user, text) {
        let users = this.users.filter(u => u.team == user.team)
        let enemies = this.users.filter(u => u.team != user.team)

        let enemyText = enemies.map(u =>
            `${`${u.member.displayName} • Lv. ${u.user.data.level}`.padStart(42)}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padStart(20, '▁').padStart(42)}`
        ).array().join('\n')

        let userText = users.map(u => {
            return u.user.id == user.user.id
                ? null
                : `${u.member.displayName} • Lv. ${u.user.data.level}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')}`
        }).filter(u => u).array().join('\n')

        userText += `\n${user.member.displayName} • Lv. ${user.user.data.level}\n${''.padEnd(Math.floor(user.battle.currentHP / user.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')} ${user.battle.currentHP} / ${user.skills.find(skill => skill.name == 'HP').value} HP`

        return `\`\`\`${enemyText}\n\n\n${userText}\`\`\``
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
        this.#actions = {}
        await this.users.filter(u => !u.ai).array().forEach(async u => {
            embed.setDescription(display(u))
            let message = await u.interaction.safeUpdate({ embeds: [embed], components: [buttons], ephemeral: true, fetchReply: true })
            const collector = message.createMessageComponentCollector({ time: 300000 })
            components.push(collector)

            collector.on('collect', async i => {
                let user = i.user
                let u = this.users.get(user.id)
                u.interaction = i
                switch (i.customId.split(':')[1]) {
                    case 'home':

                        break
                    case 'attack':
                        let embed = new Discord.MessageEmbed()
                            .setTitle(`⚔️ Angriff wird vorbereitet`)
                            .setColor(this.color.normal)
                        u.attacks.forEach((a, i) => {
                            embed.addField(
                                `${(() => { return { 0: ':one:', 1: ':two:', 2: ':three', 3: ':four:', 4: ':five:', 5: ':six:' }()[i] })()} ${this.#usable[a.id].name}`,
                                `${this.#usable[a.id].description}\nVerwendungen übrig: **${a.uses}/${this.#usable[a.id].uses}**`,
                                true
                            )
                        })
                        let components = []
                        u.attacks.forEach((a, i) => {
                            if (components[0]?.components.length > 3) components.push(new Discord.MessageActionRow())
                            components[-1].addComponents(
                                new Discord.MessageButton()
                                    .setEmoji(() => { return { 0: '1️⃣', 1: '2️⃣', 2: '3️⃣', 3: '4️⃣', 4: '5️⃣', 5: '6️⃣' }()[i] })
                                    .setCustomId(`battle:${a.id}`)
                                    .setStyle('SUCCESS')
                            )
                        })
                        components.push(new Discord.MessageActionRow()
                            .addComponents(
                                new Discord.MessageButton()
                                    .setEmoji('🏡')
                                    .setCustomId('battle:home')
                                    .setStyle('DANGER')
                            )
                        )
                        await u.interaction.safeUpdate({ embeds: [embed], components, ephemeral: true })
                        break
                    case 'items':

                        break
                    case 'heal':

                        break
                    default:
                        let targets = new Discord.Collection()
                        let action = this.#usable[i.customId]
                        if (action.type.startsWith('item')) targets = this.users.filter(u => u.id == user.id)
                        else if (action.type.startsWith('atk')) {
                            if (this.users.size > 2) {
                                //TODO: Nutzer fragen, auf wen der Angriff angewendet werden soll.
                            } else {
                                /*
                                target:
                                    0: Einzelnes Ziel (andere Person)
                                    1: Einzelnes Ziel: man selbst
                                    2: Einzelnes Ziel: Teammitglied
                                    3: Einzelnes Ziel: Irgendwer (exklusiv man selbst)
                                    4: Mehrere Ziele: eigenes Team (inklusiv man selbst)
                                    5: Mehrere Ziele: gegnerisches Team
                                    6: Mehrere Ziele: alle Teilnehmer (exklusiv man selbst)
                                    7: Mehrere Ziele: alle Teilnehmer (inklusiv man selbst)
                            */
                                targets = 
                                    (action.target == 7) ? targets = this.users :
                                    ([0, 3, 5, 6].includes(action.target)) ? targets = this.users.filter(u => u.user.id != user.id) :
                                    targets = this.users.filter(u => u.user.id == user.id)
                            }
                        }
                        this.#actions[u.id] = { action: i.cutsomId, target: targets, user: u }
                }
            })

            collector.on('end', async reason => {

            })
        })
    }

    async * calculations() {

    }
}