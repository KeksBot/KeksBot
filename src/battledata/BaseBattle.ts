import Discord from 'discord.js'
import BattleUser from './BattleUser'
import usable from './usable.js'
var client: Discord.Client

export default class BaseBattle {
    #actions: any
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
        let embed = new Discord.EmbedBuilder()
            .setColor(this.color.yellow)
            .setTitle(`${require('../emotes.json').pinging} Warte auf Teilnehmer...`)
            .setDescription(
                'Der Kampf zwischen ' +
                this.users.array().map(user => `**${user.member.displayName}**`).join(', ').replaceLast(',', ' und') +
                'beginnt in Kürze.\nBitte drücke diesen Knopf, sobald du bereit bist. Nach 2 Minuten ohne Eingabe wird das Matchmaking abgebrochen.'
            )
        let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .setComponents(
                new Discord.ButtonBuilder()
                    .setLabel('Bereit')
                    .setCustomId('pvpBattle.ready')
                    .setStyle(Discord.ButtonStyle.Success)
            )
        let collectors: any[] = []
        await this.users.filter(u => !u.ai).array().forEach(async user => {
            let message = await user.interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true, fetchReply: true })
            //@ts-ignore
            collectors.push(message.createMessageComponentCollector({ time: 120000, max: 1 }))
        })

        collectors.forEach((collector) => {
            collector.on('collect', async (i: Discord.ButtonInteraction) => {
                this.users.get(i.user.id).interaction = i
                if (collectors.length <= 1) return this.afterLoading()
                let embed = new Discord.EmbedBuilder()
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