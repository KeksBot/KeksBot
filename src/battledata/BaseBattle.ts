import Discord from 'discord.js'
import BattleUser from './BattleUser'
import usable from './usable.js'
import emotes from '../emotes.json'

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
        let updater: any
        let readyArray: boolean[] = []
        await Promise.all(this.users.map(async u => {
            let output = await u.ready()
            //TODO: Set updater to embed update promise timeout
            readyArray.push(output)
        }))
        if (readyArray.includes(false)) {
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
    }

    async game() {
        this.round()
    }

    async * calculations() {

    }
}