import Discord from 'discord.js'
import BattleUser from './BattleUser'
import usable from './usable.js'
import emotes from '../emotes.json'
import { imageRendererAPI } from '../config.json'

export default class BaseBattle {
    #actions: any
    users: Discord.Collection<string, BattleUser>
    private: boolean
    message: Discord.Message
    id: number
    color: Color
    client: Discord.Client
    started: boolean

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
        this.client = message.client
        this.started = false
        this.client.battles.set(this.id, this)
    }

    /**
     * 
     * @param {BattleUser} battleUser 
     */
    addUser(battleUser: BattleUser) {
        this.users.set(battleUser.id, battleUser)
    }

    async load() {
        for (const user of this.users.values()) {
            user.setup(this.color)
        }
        let ready: any = {}
        let oldReady = {}
        let interval: any
        await Promise.all(this.users.map(async u => {
            let output = await u.ready()
            //TODO: Set updater to embed update promise timeout
            if(!interval) interval = setInterval((async () => {
                if(oldReady && ready != oldReady) {
                    let embedWaiting = new Discord.EmbedBuilder()
                        .setColor(this.color.yellow)
                        .setTitle('Kampfvorbereitung')
                        .setDescription('Du hast noch etwas Zeit, dich auf den Kampf vorzubereiten. Drück den Knopf, sobald du bereit bist.')
                        .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
                        //TODO: .setImage(imageUrl)
                    let embedWaitingForOthers = new Discord.EmbedBuilder()
                        .setColor(this.color.yellow)
                        .setTitle('Kampfvorbereitung')
                        .setDescription('Bitte warte noch einen Moment, bis alle anderen auch bereit sind...')
                        .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
                        //TODO: .setImage(imageUrl)

                    await Promise.all(this.users.map(async u => {
                        if(ready[u.id]) await u.updateMessage({ embeds: [embedWaitingForOthers] })   
                        else await u.updateMessage({ embeds: [embedWaiting] }) 
                    }))
                }
                oldReady = {...ready}
            }), 2000)
            ready[u.id] = output
        }))
        interval && clearInterval(interval)
        if ((ready.values().length < this.users.size) && !ready.values().includes(null)) {
            await Promise.all(this.users.map(u => u.updateMessage({
                embeds: [
                    new Discord.EmbedBuilder()
                        .setTitle(`${emotes.denied} Matchmaking abgebrochen`)
                        .setDescription(`Es waren nicht alle Teilnehmer bereit und das Matchmaking wurde abgebrochen.`)
                ], components: []
            })))
            return this.client.battles.delete(this.id)
        }
        this.started = true
        for (const user of this.users.values()) {
            user.init()
        }
        this.afterLoading()
    }

    async afterLoading() {
        return true
    }

    async round() {
        let status: any = {}
        await Promise.all(this.users.map(async u => {
            let users = []
            users.push({
                n: u.member.displayName,
                h: u.battle.currentHP,
                m: u.skills.find(s => s.name == 'HP').value,
                l: u.user.data.level,
                t: u.team
            })
            for (const user of this.users.values()) {
                if (user.id != u.id) {
                    users.push({
                        n: user.member.displayName,
                        h: user.battle.currentHP,
                        m: user.skills.find(s => s.name == 'HP').value,
                        l: user.user.data.level,
                        t: user.team
                    })
                }
            }
            await u.chooseAction(`${imageRendererAPI}/b?users=${JSON.stringify(users)}`).catch()
            status[u.id] = true
            if(status.values().length != this.users.size) await u.updateMessage({
                embeds: [
                    Discord.EmbedBuilder.from(u.interaction.message.embeds[0]).setFooter({ text: 'Bitte warte noch einen Moment, bis alle anderen eine Eingabe getätigt haben.'}),
                ]
            })
        }))
        if(status.values().length != this.users.size) {
            for await (const u of this.users.values()) {
                await u.updateMessage({
                    embeds: [
                        new Discord.EmbedBuilder()
                            .setTitle(`${emotes.denied} Timeout`)
                            .setDescription('Ein Spieler scheint AFK zu sein. Der Kampf wurde abgebrochen.')
                            .setColor(this.color.red)
                    ], components: []
                })
            }
            return this.client.battles.delete(this.id)
        }
        for (const user of this.users.values()) {
            this.#actions.push({
                user: user.id,
                action: user.interaction.customId.split(':')[2]
            })
        }
    }

    async game() {
        this.round()
    }

    async * calculations() {

    }
}