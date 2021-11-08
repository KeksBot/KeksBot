const embeds = require('./embeds')
const fs = require('fs')
const path = require('path')
const discord = require('discord.js')
const delay = require('delay')

const validatePermissions = (command) => {
    const validPermissions = [
        'ADMINISTRATOR',
        'CREATE_INSTANT_INVITE',
        'KICK_MEMBERS',
        'BAN_MEMBERS',
        'MANAGE_CHANNELS',
        'MANAGE_GUILD',
        'ADD_REACTIONS',
        'VIEW_AUDIT_LOG',
        'PRIORITY_SPEAKER',
        'STREAM',
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'SEND_TTS_MESSAGES',
        'MANAGE_MESSAGES',
        'EMBED_LINKS',
        'ATTACH_FILES',
        'READ_MESSAGE_HISTORY',
        'MENTION_EVERYONE',
        'USE_EXTERNAL_EMOJIS',
        'VIEW_GUILD_INSIGHTS',
        'CONNECT',
        'SPEAK',
        'MUTE_MEMBER',
        'DEAFEN_MEMBERS',
        'MOVE_MEMBERS',
        'USE_VAD',
        'CHANGE_NICKNAME',
        'MANAGE_NICKNAMES',
        'MANAGE_ROLES',
        'MANAGE_WEBHOOKS',
        'MANAGE_EMOJIS_AND_STICKERS',
        'USE_APPLICATION_COMMANDS',
        'REQUEST_TO_SPEAK',
        'MANAGE_THREADS',
        'USE_PUBLIC_THREADS',
        'USE_PRIVATE_THREADS',
        'USE_EXTERNAL_STICKERS'
    ]
    if(!validPermissions.includes(command.permission)) throw new Error(`Unbekannte Permission "${command.permission} bei "${command.name}"`)
}

const getcolors = require('./subcommands/getcolor')
const getData = require('./db/getData')
const update = require('./db/update')

module.exports = async (client) => {
    client.commands = new discord.Collection()
    client.cooldowns = new discord.Collection()

    const readCommands = dir => {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for(const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file))
            if(stat.isDirectory()) {
                readCommands(path.join(dir, file))
            } else {
                if(file.endsWith('.js') && !file.startsWith('subcmd' || 'subcommand')) {
                    var command = require(path.join(__dirname, dir, file))
                    if(command.permission) {
                        command.defaultPermission = false
                        command.permission = command.permission.toUpperCase()
                        validatePermissions(command)
                    }
                    client.commands.set(command.name, command)
                    console.log(`[${client.user.username}]: ${command.name} wurde geladen.`)
                }

            }
        }
    }
    console.log(`[${client.user.username}]: Commands werden geladen.`)
    readCommands('./slashcommands')
    console.log(`[${client.user.username}]: Commands werden initialisiert.`)
    /* Mögliches Konzept für Sprachsystem
     * let db = await require('./db/database')()
     * let serverdata = require('./schemas/serverdata')()
     * let commandData = {}
     * await client.guilds.fetch()
     * for (const command of commands) {
     *     
     * }
     * for (const guild of client.guilds) {
     *     let data = await serverdata.findById(data.id)
     *     if(data.lang == 'de') {
     *         await guild.commands.set()
     *     }
     * }*/
    await client.guilds.fetch()
    var progress = 0
    var failedguilds = 0
    var end = false
    await client.guilds.cache.array().forEach(async guild => {
        try {
            let commands = await guild.commands.set(client.commands.array())
            await guild.roles.fetch()
            commands.array().forEach(async function(command) {
                if(client.commands.find(c => c.name === command.name).permission) {
                    var permissions = []
                    var length = guild.roles.cache
                        .filter(r => !r.tags || (!r.tags.botId && r.tags.integrationId))
                        .filter(r => r.permissions.has(client.commands.find(c => c.name === command.name).permission)).size
                    var counter = 0
                    var accepted = 0
                    guild.roles.cache
                        .filter(r => !r.tags || (!r.tags.botId && r.tags.integrationId))
                        .filter(r => r.permissions.has(client.commands.find(c => c.name === command.name).permission))
                        .array()
                        .forEach(async function (role) {
                            permissions.push({
                                id: role.id,
                                type: 'ROLE',
                                permission: true
                            })
                            accepted ++
                            counter ++
                            if(accepted == 10 || counter == length - 1) {
                                try {await command.permissions.add({permissions})} catch {}
                                permissions = []
                                accepted = 0
                            }
                        })
                }
            })
        } catch (error) {
            failedguilds++
        } finally {
            progress ++
            if(progress == client.guilds.cache.size) end = true
        }
    })
    while(!end) {await delay(500)}
    console.log(`[${client.user.username}]: Initialisierung abgeschlossen.`)
    if(failedguilds) console.log('Commands wurden auf ' + failedguilds + ' Servern NICHT geladen.')

    client.on('interactionCreate', async function(ita) {
        //Commandhandling
        if(!ita.isCommand()) return
        let command = client.commands.get(ita.commandName)
        if(!command) {
            return embeds.error(ita, 'Fehler', 'Der Befehl wurde nicht gefunden.', true, true)
        }
        var args = {}
        ita.options._hoistedOptions.forEach(option => args[option.name] = option.value)

        //Daten laden
        var status = {user: false, server: false}
        getData('serverdata', ita.guild.id).then(async function(data) {
            if(!data) data = await require('./db/create')('serverdata', ita.guild.id)
            ita.guild.data = data
            ita.color = await getcolors(ita.guild, data)
            status.server = true
        })
        getData('userdata', ita.user.id).then(async function(data) {
            if(!data) data = await require('./db/create')('userdata', ita.user.id)
            ita.user.data = data
            if(data.banned && data.banned.time) {
                console.log(1)
                ita.user.data = -2
                if(!data.banned.time || data.banned.time < Date.now()) {
                    let reason = '_Es liegt keine Begründung vor._'
                    if(data.banned.reason) reason = `Begründung: _${data.banned.reason}_`
                    let timestamp = ''
                    if(data.banned.time && data.banned.time != Infinity) timestamp = `\n\nDer Bann wird <t:${Math.round(data.banned.time / 1000)}:R> aufgehoben.`
                    while(!ita.color) {}
                    embeds.error(ita, 'Nutzung verboten', `Du wurdest von der KeksBot Nutzung gebannt.\n${reason}\n\nSolltest du Fragen zu diesem Fall haben, wende dich bitte an das [KeksBot Team](discord.gg/g8AkYzWRCK).${timestamp}`, true)
                }
                if(data.banned.time && data.banned.time < Date.now()) {
                    delete data.banned
                    ita.user.data = data
                    await update('userdata', ita.user.id, data)
                }
            }
            status.user = true
        })

        //Commandhandling
        let cancel = setTimeout(function(status) {
            if(!status.user) status.user = -1
            if(!status.server) status.server = -1
        }, 10000)
        while(!status.user && !status.server) {await delay(50)}
        clearTimeout(cancel)
        if(!ita.guild.available) return
        if(ita.user.data == -2) return
        if(ita.user.data == -1 || ita.guild.data == -1) return embeds.error(ita, 'Fehler', 'Timeout der beim Laden erforderlichen Daten. Bitte probiere es später erneut.', true).catch()

        //Cooldown
        const { cooldowns } = client
        if(!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new discord.Collection())
        }
        
        const now = Date.now()
        const timestamps = cooldowns.get(command.name)
        const cooldownAmount = (command.cooldown || 1) * 1000
    
        if(timestamps.has(ita.user.id)) {
            const expirationTime = timestamps.get(ita.user.id) + cooldownAmount
        
            if(now < expirationTime) {
                const timeLeft = Math.floor(expirationTime / 1000)
                return embeds.error(ita, 'Cooldown', `Du kannst den ${command.name} Befehl erst wieder ${timeLeft} benutzen.`, true)
            }
        }
        
        timestamps.set(ita.user.id, now)
        setTimeout(() => timestamps.delete(ita.user.id), cooldownAmount)

        //Execute
        try {
            let argsarray = []
            for (const item in args) {
                argsarray.push(args[item])
            }
            let d = new Date()
            console.log(`${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} | ${ita.user.tag} | ID: ${ita.user.id} | ${ita.guild.name} | ID: ${ita.guild.id} | ${command.name} | [ ${argsarray.join(', ')} ]`)
            await command.execute(ita, args, client)
        } catch (error) {
            console.error(error)
            return embeds.error(ita, 'Fehler', 'Beim Ausführen des Commands ist ein unbekannter Fehler aufgetreten.\nBitte probiere es später erneut.', true, true)
        }
    })
}