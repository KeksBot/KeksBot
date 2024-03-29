import Discord from 'discord.js'
const client: Discord.Client = new Discord.Client(
    { 
        intents: ['Guilds', 'GuildMembers', 'GuildEmojisAndStickers', 'GuildMessages', 'DirectMessages', 'DirectMessageReactions'],
        sweepers: {
            users: {
                interval: 30000, //@ts-ignore
                filter: () => (user: Discord.User, id: string) => user.storage?.expires > Date.now() || id == client.user.id
            }
        }
    }
)
import config from './config.json'
import commandhandler from './commandhandler'
import eventhandler from './eventhandler'
import autocompletehandler from './autocomplete'
// import uptimemonitoring from './uptimemonitoring'

import './db'
import embeds from './embeds'

process.on('exit', async (code) => {
    let channel = await client.channels.fetch(config.logChannel)
    console.log(`[${client?.user.username}]: System wird heruntergefahren.`)
    let embed = new Discord.EmbedBuilder()
        .setColor('DarkRed')
        .setTitle('Shutdown')
        .setDescription(`Der Prozess wird beendet. Exit Code: ${code}`)
    //@ts-ignore
    channel.send({ embeds: [embed] })
    client.user.setStatus('invisible')
})

Discord.Collection.prototype.array = function () { return [...this.values()] }
/**
 * 
 * @param {Object} messageOptions 
 * @returns discord.CommandInteraction
 */

Discord.CommandInteraction.prototype.safeReply = async function (messageOptions: Discord.InteractionReplyOptions) {
    if (this.replied) return await this.editReply(messageOptions)
    else return await this.reply(messageOptions)
}

/**
 * 
 * @param {Object} messageOptions 
 * @returns discord.CommandInteraction
 */

Discord.ButtonInteraction.prototype.safeUpdate = async function (messageOptions: Discord.InteractionUpdateOptions) {
    if (this.replied) return await this.editReply(messageOptions)
    else return await this.update(messageOptions)
}

Discord.StringSelectMenuInteraction.prototype.safeUpdate = async function (messageOptions: Discord.InteractionUpdateOptions) {
    if (this.replied) return await this.editReply(messageOptions)
    else return await this.update(messageOptions)
}

//@ts-ignore
Discord.CommandInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.ButtonInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.StringSelectMenuInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.CommandInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.error(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.ButtonInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.error(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.StringSelectMenuInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await embeds.error(this, title, description, ephemeral, del)
}


/**
 * 
 * @param {String|RegExp} searchValue 
 * @param {String} replaceValue 
 * @returns String
 */
String.prototype.replaceLast = function (searchValue: String, replaceValue: String) {
    return this.replace(new RegExp(searchValue + "([^" + searchValue + "]*)$"), replaceValue + "$1");
}

String.prototype.title = function () {
    return this.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();});
};

var date = new Date()
console.log(`Starte System am ${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`)

client.once('ready', async () => { //Status
    client.user.setStatus('idle')
    var start = Date.now()
    console.log(`[${client.user.username}]: Client geladen.`)
    console.log(`[${client.user.username}]: Monitoring wird aktiviert.`)
    // uptimemonitoring(config.uptimeurl, client)
    console.log(`[${client.user.username}]: System wird gestartet.`)
    client.setMaxListeners(0)
    console.log(`[${client.user.username}]: Verbindung zur Datenbank hergestellt.`)
    await commandhandler(client)
    await eventhandler(client)
    await autocompletehandler(client)
    var end = Date.now()
    console.log(`[${client.user.username}]: System aktiv.`)
    console.log(`[${client.user.username}]: Startzeit betrug ${end - start} ms.`)

    client.battles = new Discord.Collection()
    client.user.setStatus('online')
})

client.login(config.token)