const embeds = require('./embeds')
const fs = require('fs')
const path = require('path')
const discord = require('discord.js')
const delay = require('delay')
const config = require('./config.json')
const { Model } = require('mongoose')

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
            if(data.banned) {
                ita.user.data = -2
                if(!data.banned.mentioned && (!data.banned.timestamp || data.banned.timestamp < Date.now())) {
                    let reason = '_Es liegt keine Begründung vor._'
                    if(data.banned.reason) reason = `Begründung: _${data.banned.reason}_`
                    let timestamp = ''
                    if(data.banned.timestamp) timestamp = `\n\nDer Bann wird <t:${Math.round(data.banned.timestamp / 1000)}:R> aufgehoben.`
                    while(!ita.color) {}
                    embeds.error(ita, 'Nutzung verboten', `Du wurdest von der KeksBot Nutzung gebannt.\n${reason}\n\nSolltest du Fragen zu diesem Fall haben, wende dich bitte an das [KeksBot Team](discord.gg/g8AkYzWRCK).${timestamp}`, true)
                    return update('userdata', ita.user.id, { banned: { mentioned: true }})
                }
                if(data.banned.timestamp && data.banned.timestamp < Date.now()) {
                    delete data.banned
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
        while(!status.user && !status.server) {}
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

        try {
            await command.execute(ita, client)
        } catch (error) {
            return embeds.error(ita, 'Fehler', 'Beim Ausführen des Commands ist ein unbekannter Fehler aufgetreten.\nBitte probiere es später erneut.', true, true)
        }
    })

    // client.on('message', async msg => {
    //     if(ita.user.bot || ita.user.system || !msg.guild) return
    //     const serverdata = require('./serverdata.json')
    //     const userdata = require('./userdata.json')
    //     const emotes = require('./emotes.json')
    //     if(serverdata[msg.guild.id]) var prefix = serverdata[msg.guild.id].prefix 
    //     else var prefix = config.prefix
    //     if(msg.content.toLowerCase().startsWith(prefix.toLowerCase())) text = msg.content.substring(prefix.length)
    //     else if(msg.content.startsWith('<@774885703929561089>')) text = msg.content.substring(21)
    //     else if(msg.content.startsWith('<@!774885703929561089>')) text = msg.content.substring(22)
    //     else return
    //     text = text.trim()
    //     const args = text.split(/ +/)
    //     const commandName = args.shift().toLowerCase()
      
    //     const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.commands && cmd.commands.includes(commandName))
    //     if(!command) return

    //     if(userdata[ita.user.id] && userdata[ita.user.id].banned) return

    //     if(client.restarting && client.restarting >= 6000) return
    //     if(client.restarting) return embeds.error(msg, 'Neustart eingeleitet', 'Ein Neustart wird gerade initialisiert.\nDer Befehl wurde nicht ausgeführt.')

    //     if(command.permissions) {
    //         command.permissions.forEach(async p => {
    //             if(!msg.member.permissions.has(p)) {
    //                 if(!msg.deleted) await msg.delete().catch()
    //                 return embeds.needperms(p)
    //             }
    //         })
    //     }

    //     if(command.modonly && !config.mods.includes(ita.user.id)) {
    //         if(!msg.deleted) msg.delete().catch()
    //         return embeds.needperms(msg, 'KeksBot-Moderator')
    //     }

    //     if(command.devonly && !config.devs.includes(ita.user.id)) {
    //         if(!msg.deleted) msg.delete().catch()
    //         return embeds.needperms(msg, 'KeksBot-Developer')
    //     }

    //     if(command.minArgs && command.minArgs > args.length) {
    //         if(!msg.deleted) msg.delete().catch()
    //         return embeds.error(msg, 'Syntaxfehler', `Du hast zu wenig Argumente angegeben.\nBitte verwende diese Syntax:\n\`${prefix}${command.name} ${command.expectedArgs}\``)
    //     }

    //     if(command.maxArgs && command.maxArgs < args.length) {
    //         if(!msg.deleted) msg.delete().catch()
    //         return embeds.error(msg, 'Syntaxfehler', `Du hast zu viele Argumente angegeben.\nBitte verwende diese Syntax:\n\`${prefix}${command.name} ${command.expectedArgs}\``)
    //     }











    //     const { cooldowns } = client
        
    //     if(!cooldowns.has(command.name)) {
    //         cooldowns.set(command.name, new discord.Collection())
    //     }
        
    //     const now = Date.now()
    //     const timestamps = cooldowns.get(command.name)
    //     const cooldownAmount = (command.cooldown || 0) * 1000
    
    //     if(timestamps.has(ita.user.id)) {
    //         const expirationTime = timestamps.get(ita.user.id) + cooldownAmount
        
    //         if(now < expirationTime) {
    //             const timeLeft = (expirationTime - now) / 1000
    //             if(!msg.deleted) msg.delete().catch()
    //             const hours = Math.floor(timeLeft / 1000 * 60 * 60)
    //             const minutes = Math.floor((timeLeft - hours * 1000 * 60 * 60) / 1000 * 60)
    //             const seconds = Math.floor((timeLeft - hours * 1000 * 60 * 60 - minutes * 1000 * 60) / 1000)
    //             const time = ''
    //             if(hours > 0) {
    //                 if(hours == 1) time += `1 Stunde `
    //                 else time += `${hours} Stunden `
    //             }
    //             if(minutes > 0) {
    //                 if(minutes == 1) time += `minutes `
    //                 else time += `${minutes} Minuten `
    //             }
    //             if(hours > 0 && seconds > 0 && minutes == 0) time += '0 Minuten '
    //             if(seconds > 0) {
    //                 if(seconds == 1) time += '1 Sekunde'
    //                 else time += `${seconds} Sekunden `
    //             }
    //             return embeds.error(msg, 'Cooldown', `Bitte warte noch ${time.trim()}, bevor du den ${command.name} hernehmen kannst.`)
    //         }
    //     }
        
    //     timestamps.set(ita.user.id, now)
    //     setTimeout(() => timestamps.delete(ita.user.id), cooldownAmount)
        
    //     if(serverdata[msg.guild.id]) {
    //         var color = getcolors(msg, serverdata)
    //         if(serverdata[msg.guild.id].color) {
    //             if(serverdata[msg.guild.id].color === 'role') color.normal = msg.guild.me.displayHexColor
    //             else color.normal = serverdata[msg.guild.id].color
    //         }
    //         if(serverdata[msg.guild.id].ic && serverdata[msg.guild.id].ic.includes(msg.channel.id)) return
    //         if(serverdata[msg.guild.id].ir) {
    //             var temp = false
    //             serverdata[msg.guild.id].ir.forEach(role => {
    //                 if(msg.member.roles.cache.has(role)) temp = true
    //             })
    //             if(temp) return
    //         }
    //     }

    //     if(!color) var color = {
    //         red: 0xff0000,
    //         lightblue: 0x3498db,
    //         lime: 0x2ecc71,
    //         yellow: 0xf1c40f,
    //         normal: 0x00b99b
    //     }

    //     try {
    //         console.log(`${ita.user.tag}: ${command.name} | ${args} | ${msg.content}`)
    //         await command.callback(msg, args, client, serverdata, userdata, config, emotes, color, embeds)
    //     } catch (err) {
    //         console.log(`Beim Ausführen von ${command.name} durch ${ita.user.tag} ist ein Fehler aufgetreten:\n${err}\n----------------------------`)
    //         embeds.error(msg, 'Oh oh', `Beim Ausführen des ${command.name} Commands ist ein unbekannter Fehler aufgetreten D:\nBitte probiere es später erneut.`)
    //         return
    //     }
    // })
}