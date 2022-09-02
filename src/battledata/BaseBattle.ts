import Discord from 'discord.js'
import BattleUser from './BattleUser'
import usable from './usable'
import emotes from '../emotes.json'
import { imageRendererAPI } from '../config.json'
import delay from 'delay'

export default class BaseBattle {
    #actions: {
        targets?: string[],
        action: number,
        user: BattleUser,
        move: BattleAction
    }[]
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
        !this.private && this.message.deletable && this.message.delete()
        for (const user of this.users.values()) {
            user.setup(this.color)
        }
        let ready: any = {}
        for (const user of this.users.values()) {
            ready[user.id] = false
        }
        let oldReady = {}
        let interval: any
        let imageUrl = `${imageRendererAPI}/r?users=`
        let imageObject: any = {}
        for (const id in ready) {
            imageObject[this.users.get(id).name] = ready[id]
        }
        imageUrl += JSON.stringify(imageObject)
        await Promise.all(this.users.map(async u => {
            let output = await u.ready(imageUrl)
            //TODO: Set updater to embed update promise timeout
            if(!interval && output) interval = setInterval((async () => {
                if(oldReady && ready != oldReady) {
                    let imageUrl = `${imageRendererAPI}/r?users=`
                    let imageObject: any = {}
                    for (const id in ready) {
                        imageObject[this.users.get(id).name] = ready[id]
                    }
                    imageUrl += JSON.stringify(imageObject)
                    let embedWaiting = new Discord.EmbedBuilder()
                        .setColor(this.color.yellow)
                        .setTitle('Kampfvorbereitung')
                        .setDescription('Du hast noch etwas Zeit, dich auf den Kampf vorzubereiten. Drück den Knopf, sobald du bereit bist.')
                        .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
                        .setImage(imageUrl)
                    let embedWaitingForOthers = new Discord.EmbedBuilder()
                        .setColor(this.color.yellow)
                        .setTitle('Kampfvorbereitung')
                        .setDescription('Bitte warte noch einen Moment, bis die anderen Teilnehmer auch bereit sind.')
                        .setFooter({ text: 'Nach 2 Minuten wird das Matchmaking abgebrochen.' })
                        .setImage(imageUrl)

                    for (const u of this.users.values()) {
                        if(ready[u.id]) await u.updateMessage({ embeds: [embedWaitingForOthers] })   
                        else await u.updateMessage({ embeds: [embedWaiting] }) 
                    }
                }
                oldReady = {...ready}
            }), 2000)
            ready[u.id] = output
            if(Object.values(ready).includes(false)) {
                let embed = Discord.EmbedBuilder.from(u.interaction.message.embeds[0])
                let imageUrl: string 
                let image = JSON.parse(embed.data.image.url.split('=')[1])
                image[u.name] = true
                imageUrl = `${imageRendererAPI}/r?users=${JSON.stringify(image)}`
                embed.setDescription('Bitte warte noch einen Moment, bis die anderen Teilnehmer auch bereit sind.')
                    .setImage(imageUrl)
                await u.updateMessage({ embeds: [embed] })
            }
        }))
        interval && clearInterval(interval)
        if ((Object.values(ready).length < this.users.size) && !Object.values(ready).includes(false)) {
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
        return await this.afterLoading()
    }

    async afterLoading() {
        return true
    }

    async round() {
        let status: any = {}
        this.#actions = []
        let userarray = this.users.map(u => {return { name: u.name, team: u.team, id: u.id }})
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
            status[u.id] = await u.chooseAction(`${imageRendererAPI}/b?users=${JSON.stringify(users)}`, userarray).catch(e => {return false})
            if(Object.values(status).length != this.users.size && status[u.id]) await u.updateMessage({
                embeds: [
                    Discord.EmbedBuilder.from(u.interaction.message.embeds[0]).setFooter({ text: 'Bitte warte noch einen Moment, bis alle anderen eine Eingabe getätigt haben.'}),
                ],
                components: []
            })
            else try {
                await u.interaction?.deferUpdate()
            } catch (e) {}
        }))
        if(Object.values(status).length != this.users.size || Object.values(status).includes(false)) {
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
            this.#actions.push(Object.assign(user.move, { move: usable[user.move.action]}))
        }
        this.#actions.sort((a, b) => {
            if(a.move.priority > b.move.priority) return -1
            if(a.move.priority < b.move.priority) return 1

            if(a.user.skills.find(s => s.name == 'spd') > b.user.skills.find(s => s.name == 'spd')) return -1
            if(a.user.skills.find(s => s.name == 'spd') < b.user.skills.find(s => s.name == 'spd')) return 1
        })
        let calc = this.calculations()
        let done = false
        while(!done) {
            let { value: text, done: isDone } = await calc.next()
            if(isDone) done = true
            if(done || !text) break
            const updateDuration = Math.round(2000 / this.users.size)

            let embed = new Discord.EmbedBuilder()
                .setColor(this.color.normal)
                .setFooter({ text: text })
            for (const u of this.users.values()) {
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
                embed.setImage(`${imageRendererAPI}/b?users=${JSON.stringify(users)}`)
                await u.updateMessage({ embeds: [embed] })
                await delay(updateDuration)
            }
            if(text.trim().includes('\n')) await delay(text.trim().split('\n').length * 500)
        }
    }

    async game() {
        this.round()
    }

    async * calculations() {
        for (const action of this.#actions) {
            let actionType = action.move.type.split('/')[0]
            const { user } = action
            if(user.battle.currentHP <= 0) continue
            switch(actionType) {
                case 'atk':
                    let text = `${user.name} setzt ${action.move.name} ein.\n`
                    for (const t of action.targets) {
                        const target = this.users.get(t)
                        let hit = Math.random() * 100
                        let acu = user.getSkillValue('Genauigkeit') * action.move.accuracy
                        acu = acu > 100 ? 100 : acu
                        if(hit >= acu) {
                            if(action.targets.length == 1) yield 'Daneben!'
                            text += `${target.name} ist ausgewichen!\n`
                            continue
                        }
                        if(action.move.strength) {
                            await target.setHP(target.battle.currentHP - 
                                ((user.getSkillValue('Angriff') * action.move.strength / target.getSkillValue('Verteidigung')) * 1.6 * (1 + user.user.data.level / 100))
                            )
                        }
                        if(action.move.modifiedSkills) {
                            for (const skill of action.move.modifiedSkills.filter(s => s.onTarget)) {
                                if(skill.probability && Math.random() * 100 >= skill.probability) continue
                                target.modifySkills(skill.name, skill.value)
                                text += `${skill.name} von ${target.name} ${skill.value > 0 ? 'steigt' : 'sinkt'}.`
                            }
                        }
                        //@ts-ignore
                        if(action.move.aHeal?.onTarget) await target.heal(action.move.aHeal.value)
                        //@ts-ignore
                        if(action.move.rHeal?.onTarget) await user.heal(Math.round(target.battle.currentHP / 100 * action.move.rHeal.value))
                    }
                    for (const skill of action.move.modifiedSkills.filter(s => !s.onTarget)) {
                        if(skill.probability && Math.random() * 100 >= skill.probability) continue
                        user.modifySkills(skill.name, skill.value)
                        text += `${skill.name} von ${user.name} ${skill.value > 0 ? 'steigt' : 'sinkt'}.`
                    }
                    if(action.move.onUse) {
                        let out = await action.move.onUse(this, user, action.targets.map(t => this.users.get(t)))
                        if(out) text += out
                    }
                    //@ts-ignore
                    if(action.move.aHeal && !action.move.aHeal.onTarget) await user.heal(action.move.aHeal.value)
                    //@ts-ignore
                    if(action.move.rHeal && !action.move.rHeal.onTarget) await user.heal(Math.round(user.battle.currentHP / 100 * action.move.rHeal.value))
                    yield text
                case 'item':

                    yield ''
            }
        }
    }
}