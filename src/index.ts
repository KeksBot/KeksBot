import discord = require('discord.js')
const client: discord.Client = new discord.Client({ intents: ['GUILDS', 'GUILD_BANS', 'GUILD_MEMBERS', 'GUILD_INVITES', 'GUILD_EMOJIS_AND_STICKERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS']})
import config  = require('./config.json')
import commandhandler = require('./commandhandler')
import eventhandler = require('./eventhandler')

discord.Collection.prototype.array = function() {return [...this.values()]}
/**
 * 
 * @param {Object} messageOptions 
 * @returns discord.CommandInteraction
 */
discord.CommandInteraction.prototype.safeReply = async function(messageOptions: discord.MessageOptions) {
    if(this.replied) return await this.editReply(messageOptions)
    else return await this.reply(messageOptions)
}

/**
 * 
 * @param {Object} messageOptions 
 * @returns discord.CommandInteraction
 */
discord.ButtonInteraction.prototype.safeUpdate = async function(messageOptions: discord.MessageOptions) {
    if(this.replied) return await this.editReply(messageOptions)
    else return await this.update(messageOptions)
}

/**
 * 
 * @param {String|RegExp} searchValue 
 * @param {String} replaceValue 
 * @returns String
 */
String.prototype.replaceLast = function (searchValue: String, replaceValue: String) {
    return this.replace(new RegExp(searchValue+"([^"+searchValue+"]*)$"), replaceValue+"$1");
}

var date = new Date()
console.log(`Starte System am ${date.getDate()}.${date.getMonth() +1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)

client.once('ready', async () => { //Status
    client.user.setStatus('idle')
    var start = Date.now()
    console.log(`[${client.user.username}]: Client geladen.`)
    console.log(`[${client.user.username}]: Monitoring wird aktiviert.`)
    require('./uptimemonitoring')(config.uptimeurl, client)
    console.log(`[${client.user.username}]: System wird gestartet.`)
    client.setMaxListeners(0)
    let mongoose = await require('./db/database')()
    console.log(`[${client.user.username}]: Verbindung zur Datenbank hergestellt.`)
    mongoose.connection.close()
    await commandhandler(client)
    await eventhandler(client)
    //await automod(client)
    var end = Date.now()
    console.log(`[${client.user.username}]: System aktiv.`)
    console.log(`[${client.user.username}]: Startzeit betrug ${end - start} ms.`)

    client.battles = new discord.Collection()
    require('./battledata/PvPBattle').setClient(client)
    client.user.setStatus('online')
})

client.login(config.token)