const discord = require('discord.js')
const { EventEmitter } = require('events')
var client
const delay = require('delay')

class PvPBattle extends EventEmitter {
    constructor(user1, user2, ita1, ita2, message) {
        super()
        if(!client) throw new Error('Client not set')
        /**
         * Wichtige Information für den Clyde der Zukunft:
         * Ja, die Dinger sind Member. Warum weiß ich selbst nicht mehr. Wahrscheinlich wieder Sachen um 11 am Abend gemacht.
         * @type {discord.GuildMember}
         */
        this.user1 = user1
        /**
         * @type {discord.GuildMember}
         */
        this.user2 = user2
        this.id = new Date().getTime()
        this.user1Interaction = ita1
        this.user2Interaction = ita2
        this.message = message
        this.color = ita1.color
        this.heal = { user1: {}, user2: {} }
        this.atk = { user1: {} , user2: {} }
        this.item = { user1: {} , user2: {} }
        this.skillchanges = { user1: {} , user2: {} }
        client.battles.set(this.id, this)
    }

    static setClient(c) {
        client = c;
    }

    async load() {
        // let embed = new discord.MessageEmbed()
        //     .setColor(this.color.normal)
        //     .setTitle(`${require('../emotes.json').pinging} Kampf wird geladen`)
        //     .setDescription(`Der Kampf zwischen ${this.user1} und ${this.user2} beginnt in Kürze.`)
        // await this.message.edit({ embeds: [embed] })
        await this.message.delete()
        let embed = new discord.MessageEmbed()
            .setColor(this.color.normal)
            .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
            .setDescription(`Der Kampf zwischen ${this.user1} und ${this.user2} beginnt in Kürze.\nBitte drücke diesen Knopf, sobald du bereit bist. Nach 2 Minuten ohne Eingabe wird das Matchmaking abgebrochen.`)
        let buttons = new discord.MessageActionRow()
            .setComponents(
                new discord.MessageButton()
                    .setLabel('Bereit')
                    .setCustomId('pvpBattle.ready')
                    .setStyle('SUCCESS')
            )
        let m1 = await this.user1Interaction.editReply({ embeds: [embed], components: [buttons], fetchReply: true, ephemeral: true })
        let m2 = await this.user2Interaction.reply({ embeds: [embed], components: [buttons], fetchReply: true, ephemeral: true })
        const c1 = m1.createMessageComponentCollector({ time: 120000, max: 1 })
        const c2 = m2.createMessageComponentCollector({ time: 120000, max: 1 })

        c1.on('collect', async (ita) => {
            /**
             * @type {discord.ButtonInteraction}
             */
            this.user1Interaction = ita
            if(!c2.checkEnd()) {
                let embed = new discord.MessageEmbed()
                    .setColor(this.color.normal)
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
                    .setDescription(`Der Kampf zwischen ${this.user1} und ${this.user2} beginnt in Kürze.\nBitte warte noch einen Moment, bis ${this.user2} auch bereit ist.`)
                buttons.components[0].setDisabled(true)
                await this.user1Interaction.update({ embeds: [embed], components: [buttons], ephemeral: true })
            } else this.start()
        })

        c2.on('collect', async (ita) => {
            /**
             * @type {discord.ButtonInteraction}
             */
            this.user2Interaction = ita
            if(!c1.checkEnd()) {
                let embed = new discord.MessageEmbed()
                    .setColor(this.color.normal)
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
                    .setDescription(`Der Kampf zwischen ${this.user1} und ${this.user2} beginnt in Kürze.\nBitte warte noch einen Moment, bis ${this.user1} auch bereit ist.`)
                buttons.components[0].setDisabled(true)
                await this.user2Interaction.update({ embeds: [embed], components: [buttons], ephemeral: true })
            } else this.start()
        })

        c1.on('end', async (reason) => {
            if(reason == 'time') return this.timeout()
        })

        c2.on('end', async (reason) => {
            if(reason == 'time') return this.timeout()
        })

        return
    }

    async start() {
        let embed = new discord.MessageEmbed()
            .setColor(this.color.normal)
            .setTitle(`⚔️ Kampf wird gestartet`)
            .setDescription(`Der Kampf zwischen ${this.user1} und ${this.user2} beginnt.`)
        await this.user1Interaction.safeUpdate({ embeds: [embed], components: [] })
        await this.user2Interaction.safeUpdate({ embeds: [embed], components: [] })
        if(this.user1.user.data.battle.healTimestamp) {
            let { healTimestamp, skills, currentHP } = this.user1.user.data.battle
            let maxHP = skills.find(skill => skill.name == 'HP').value
            if(currentHP != maxHP) {
                let healBonus = skills.find(s => s.name == 'Regeneration').value || 1
                let heal = maxHP / 100
                currentHP += Math.floor(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
                if(currentHP >= maxHP) {
                    currentHP = maxHP
                    healTimestamp = 0
                } else healTimestamp = Date.now()
                this.user1.user.data.battle.healTimestamp = healTimestamp
                this.user1.user.data.battle.currentHP = currentHP
                await this.user1.user.save()
            }
        }
        if(this.user2.user.data.battle.healTimestamp) {
            let { healTimestamp, skills, currentHP } = this.user2.user.data.battle
            let maxHP = skills.find(skill => skill.name == 'HP').value
            if(currentHP != maxHP) {
                let healBonus = skills.find(s => s.name == 'Regeneration').value || 1
                let heal = maxHP / 100
                currentHP += Math.ceil(Math.floor((Date.now() - healTimestamp) / 60000) * heal * healBonus)
                if(currentHP >= maxHP) {
                    currentHP = maxHP
                    healTimestamp = 0
                } else healTimestamp = Date.now()
                this.user2.user.data.battle.healTimestamp = healTimestamp
                this.user2.user.data.battle.currentHP = currentHP
                await this.user2.user.save()
            }
        }
        await delay(2500)
        this.ended = false
        this.game()
    }

    async timeout() {
        this.user1Interaction.error('Keine Eingabe', 'Es waren nicht alle Teilnehmer bereit.')
        this.user2Interaction.error('Keine Eingabe', 'Es waren nicht alle Teilnehmer bereit.')
        client.battles.delete(this.id)
    }

    display(user) {
        if(user == 1) user = this.user1
        else if(user == 2) user = this.user2
        else throw new Error('Invalid user')
        let enemy = (user == this.user1) ? this.user2 : this.user1
        
        let enemyname = (enemy.displayName + ' • Lv. ' + enemy.user.data.level).padStart(42)
        let username = (user.displayName + ' • Lv. ' + user.user.data.level)

        let enemyhpbar = ''.padEnd(Math.floor(enemy.user.data.battle.currentHP / enemy.user.data.battle.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padStart(20, '▁').padStart(42)
        let userhpbar = ''.padEnd(Math.floor(user.user.data.battle.currentHP / user.user.data.battle.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')

        let userhp = user.user.data.battle.currentHP + ' / ' + user.user.data.battle.skills.find(skill => skill.name == 'HP').value + ' HP'

        return `\`\`\`${enemyname}\n${enemyhpbar}\n\n\n${username}\n${userhpbar}\n${userhp}\`\`\``
    }

    async game() {
        let embed = new discord.MessageEmbed()
            .setTitle(`⚔️ Imagine a title`)
            .setDescription(this.display(1))
            .setColor(this.color.normal)
        let components = [new discord.MessageActionRow()
            .addComponents(
                new discord.MessageButton()
                    .setLabel('Angreifen')
                    .setStyle('SECONDARY')
                    .setCustomId('battle:attack')
            )
        ]
        let m1 = await this.user1Interaction.safeUpdate({ embeds: [embed], fetchReply: true, components })
        let m2 = await this.user2Interaction.safeUpdate({ embeds: [embed.setDescription(this.display(2))], fetchReply: true, components })

        this.atk = { user1: {} , user2: {} }
        this.heal = { user1: {} , user2: {} }
        this.item = { user1: {} , user2: {} }
        let c1 = m1.createMessageComponentCollector({ time: 300000 })
        let c2 = m2.createMessageComponentCollector({ time: 300000 })

        c1.on('collect', async (ita) => {
            this.user1Interaction = ita
            switch(ita.customId.split(':')[1]) {
                case 'attack':
                    this.atk.user1 = { strength: 50, precision: 100 }
                    c1.stop('user')
                    break
            }
        })

        c2.on('collect', async (ita) => {
            this.user2Interaction = ita
            switch(ita.customId.split(':')[1]) {
                case 'attack':
                    this.atk.user2 = { strength: 50, precision: 100 }
                    c2.stop('user')
                    break
            }
        })

        c1.on('end', async (c, reason) => {
            if(reason == 'time') return this.battleTimeout()
            if(c2.ended && c2.endReason != 'time') {
                this.calc()
            } else {
                let embed = new discord.MessageEmbed()
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Eingabe`)
                    .setDescription(this.display(1) + '\nWarte auf gegnerische Eingabe')
                    .setColor(this.color.yellow)
                let components = this.user1Interaction.message.components.map(c => new discord.MessageActionRow().setComponents(c.components.map(b => new discord.MessageButton(b.setDisabled(true).toJSON()))))
                await this.user1Interaction.safeUpdate({ embeds: [embed], components })
            }
        })

        c2.on('end', async (c, reason) => {
            if(reason == 'time') return this.battleTimeout()
            if(c1.ended && c1.endReason != 'time') {
                this.calc()
            } else {
                let embed = new discord.MessageEmbed()
                    .setTitle(`${require('../emotes.json').pinging} Warte auf Eingabe`)
                    .setDescription(this.display(2) + '\nWarte auf gegnerische Eingabe')
                    .setColor(this.color.normal)
                let components = this.user2Interaction.message.components.map(c => new discord.MessageActionRow().setComponents(c.components.map(b => new discord.MessageButton(b.setDisabled(true).toJSON()))))
                await this.user2Interaction.safeUpdate({ embeds: [embed], components })
            }
        })
    
    }

    async calc() {
        //TODO: items
        //TODO: heal
        //atk
        let user1 = (this.user1.user.data.battle.skills.find(skill => skill.name == 'Geschwindigkeit') > this.user2.user.data.battle.skills.find(skill => skill.name == 'Geschwindigkeit')) ? this.user1 : this.user2
        let user2 = this.user1 == user1 ? this.user2 : this.user1
        let i1 = this.user1 == user1 ? 'user1' : 'user2'
        let i2 = this.user1 == user1 ? 'user2' : 'user1'

        let dmg1 = Math.floor((user1.user.data.level * .3 + 5) * (this.atk[i1].strength || 0) * (user1.user.data.battle.skills.find(skill => skill.name == 'Angriff').value / (40 * user2.user.data.battle.skills.find(skill => skill.name == 'Verteidigung').value)) * 8)
        let dmg2 = Math.floor((user2.user.data.level * .3 + 5) * (this.atk[i2].strength || 0) * (user2.user.data.battle.skills.find(skill => skill.name == 'Angriff').value / (40 * user1.user.data.battle.skills.find(skill => skill.name == 'Verteidigung').value)) * 8)

        user2.user.data.battle.currentHP -= dmg1

        if(dmg1) user2.user.data.battle.healTimestamp = Date.now()

        if(user2.user.data.battle.currentHP <= 0) {
            user2.user.data.battle.currentHP = 0
        }

        user2.user.data = await user2.user.save()

        let embed = new discord.MessageEmbed()
            .setColor(this.color.normal)
            .setTitle(`⚔️ Imagine a title`)
            .setDescription(this.display(1))
            .setFooter({ text: `${user1.user.username} greift an!` })
        this.user1Interaction.safeUpdate({ embeds: [embed], components: [] })
        embed.setDescription(this.display(2))
        this.user2Interaction.safeUpdate({ embeds: [embed], components: [] })
        await delay(1000)

        if(user2.user.data.battle.currentHP <= 0) return this.die(user2)

        user1.user.data.battle.currentHP -= dmg2

        if(dmg2) user1.user.data.battle.healTimestamp = Date.now()

        if(user1.user.data.battle.currentHP <= 0) {
            user1.user.data.battle.currentHP = 0
        }

        user1.user.data = await user1.user.save()

        embed.setDescription(this.display(1)).setFooter({ text: `${user2.user.username} greift an!` })
        this.user1Interaction.safeUpdate({ embeds: [embed], components: [] })
        embed.setDescription(this.display(2))
        this.user2Interaction.safeUpdate({ embeds: [embed], components: [] })
        await delay(1000)

        if(user1.user.data.battle.currentHP <= 0) return this.die(user1)

        this.game()
    }

    async battleTimeout() {
        this.user1Interaction.error('Keine Eingabe', 'Der Kampf wurde abgebrochen.')
        this.user2Interaction.error('Keine Eingabe', 'Der Kampf wurde abgebrochen.')
        client.battles.delete(this.id)
    }

    async die(user) {
        let li = (this.user1Interaction.user.id == user.id) ? this.user1Interaction : this.user2Interaction
        let wi = (this.user1Interaction.user.id == user.id) ? this.user2Interaction : this.user1Interaction

        let xp = Math.floor(((((li.user.data.level * 2.7 + 30) * li.user.data.level) / 4 * (((2 * li.user.data.level + 10) ** 2.2) / (wi.user.data.level + li.user.data.level + 10) ** 2)) + 1) * 2.3)
        wi.user.data.xp += xp

        let scanning = true
        let levelcount = 0

        while (scanning) {
            if(wi.user.data.level <= 15 && (wi.user.data.level + 1) ** 3 * ((24 + Math.floor((wi.user.data.level + 2) / 3)) / 3) <= wi.user.data.xp) {
            } else if(wi.user.data.level <= 36 && wi.user.data.level > 15 && (wi.user.data.level + 1) ** 3 * ((15 + wi.user.data.level) / 3) <= wi.user.data.xp) {
            } else if(wi.user.data.level < 100 && wi.user.data.level > 37 && (wi.user.data.level + 1) ** 3 * ((32 + Math.floor((wi.user.data.level + 1) / 2)) / 3)) {
            } else scanning = false
            if(scanning) {
                wi.user.data.level++
                levelcount++
            }
        }
        await wi.user.save()

        let lembed = new discord.MessageEmbed()
            .setTitle(`🪦 Du bist gestorben`)
            .setDescription(`${wi.user.username} hat dich besiegt.`)
            .setColor(this.color.red)
        let wembed = new discord.MessageEmbed()
            .setTitle('🏆 Du hast gewonnen')
            .setDescription(`${li.user.username} wurde besiegt!\nDu erhältst ${xp} Erfahrungspunkte.`)
            .setColor(this.color.lime)
        await li.safeUpdate({ embeds: [lembed], components: [] })
        await wi.safeUpdate({ embeds: [wembed], components: [] })
        if(levelcount) {
            await delay(3000)
            client.emit('userLevelUp', wi, levelcount)
        }
        client.battles.delete(this.id)
    }
}

module.exports = PvPBattle