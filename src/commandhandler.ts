import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'
import delay from 'delay'

import embeds from './embeds'
import getcolors from './subcommands/getcolor'
import getData from './db/getData'
import update from './db/update'

export default async (client: Discord.Client) => {
    client.commands = new Discord.Collection()
    client.cooldowns = new Discord.Collection()

    const readCommands = (dir: string) => {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for(const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file))
            if(stat.isDirectory()) {
                readCommands(path.join(dir, file))
            } else {
                if(file.endsWith('.js') && !file.startsWith('!')) {
                    var command = require(path.join(__dirname, dir, file))
                    if(command.permission) {
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

    await client.guilds.fetch()
    let progress = 0
    let failedguilds = 0
    let end = false
    client.guilds.cache.array().forEach(async guild => {
        try {
            await guild.commands.set(client.commands.array())
        } catch (error) {
            console.error(error)
            console.log(`[${client.user.username}]: Server nicht geladen: ${guild.id} | ${guild.name} | ${guild.ownerId}`)
            failedguilds++
        } finally {
            progress ++
            if(progress == client.guilds.cache.size) end = true
        }
    })
    while(!end) {await delay(500)}
    console.log(`[${client.user.username}]: Initialisierung abgeschlossen.`)
    if(failedguilds) console.log('Commands wurden auf ' + failedguilds + ' Servern NICHT geladen.')

    //@ts-ignore
    client.on('interactionCreate', async function(interaction: Discord.CommandInteraction) {
        //Commandhandling
        if(interaction.type == Discord.InteractionType.ApplicationCommand) return
        
        let command = client.commands.get(interaction.commandName)
        if(!command) {
            return embeds.error(interaction, 'Fehler', 'Der Befehl wurde nicht gefunden.', true, true)
        }
        let args: any = {}
        interaction.options.data.forEach(option => args[option.name.replaceAll('-', '_')] = option.attachment || option.value)
        //@ts-ignore
        if(interaction.options.getSubcommand(false) || false) args.subcommand = interaction.options.getSubcommand(false)
        //@ts-ignore
        if(interaction.options.getSubcommandGroup(false) || false) args.subcommandgroup = interaction.options.getSubcommandGroup(false)

        if(!interaction.guild.available) return

        //let newUser = false
        let tempdata: any = await getData('serverdata', interaction.guild.id)
        if(!tempdata) tempdata = await require('./db/create')('serverdata', interaction.guild.id)
        interaction.guild.data = tempdata
        interaction.color = await getcolors(interaction.guild)
        tempdata = await getData('userdata', interaction.user.id)
        if(!tempdata) {
            tempdata = await require('./db/create')('userdata', interaction.user.id, { level: 1, xp: 0, cookies: 0 })
        }
        interaction.user.data = tempdata
        if(tempdata.banned && tempdata.banned.time) {
            if(tempdata.banned.time > Date.now()) {
                let reason = '_Es liegt keine Begründung vor._'
                if(tempdata.banned.reason) reason = `Begründung: _${tempdata.banned.reason}_`
                let timestamp = ''
                if(tempdata.banned.time != -1) timestamp = `\n\nDer Bann wird <t:${Math.round(tempdata.banned.time / 1000)}:R> aufgehoben.`
                while(!interaction.color) {await delay(50)}
                return embeds.error(interaction, 'Nutzung verboten', `Du wurdest von der KeksBot Nutzung gebannt.\n${reason}\n\nSolltest du Fragen zu diesem Fall haben, wende dich bitte an das [KeksBot Team](discord.gg/g8AkYzWRCK).${timestamp}`, true)
            }
            if(tempdata.banned.time != -1 && tempdata.banned.time < Date.now()) {
                delete tempdata.banned
                interaction.user.data = tempdata
                await update('userdata', interaction.user.id, { banned: null })
            }
        }


        //Commandhandling

        //Cookiebanner; möglich in zukünftigen Versionen
        /* if(newUser) {
            let newUserEmbed = new discord.MessageEmbed()
                .setColor(ita.color.normal)
                .setTitle('Hewwwoo')
                .setDescription('Du scheinst neu beim KeksBot zu sein.\nBitte beachte, dass wir wie jeder im Internet Daten speichern ~~und dann an Meta verkaufen~~. \nDies ist zur Nutzung des KeksBot erforderlich; wenn du mit der Speicherung von Nutzungsdaten einverstanden bist, drücke "Akzeptieren". Du kannst Einsicht oder Löschung deiner Daten jederzeit beim [Team](discord.gg/g8AkYzWRCK "Zum KeksBot Support Server") beantragen.\nWir wünschen dir viel Spaß beim Kekse sammeln.')
            let buttons = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Akzeptieren')
                        .setStyle('SUCCESS')
                        .setCustomId('newUserAccept')
                )
            let message = await ita.reply({ embeds: [newUserEmbed], buttons: [buttons], ephemeral: true, fetchReply: true })
            await message.awaitMessageComponent({ componentType: 'BUTTON', time: 60000, customId: 'newUserAccept' })
        } */

        //Cooldown
        const { cooldowns } = client
        if(!cooldowns.has(command.name)) {
            cooldowns.set(command.name, new Discord.Collection())
        }
        
        const now = Date.now()
        const timestamps = cooldowns.get(command.name)
        const cooldownAmount = (command.cooldown || 1) * 1000
    
        if(timestamps.has(interaction.user.id)) {
            const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount
        
            if(now < expirationTime) {
                const timeLeft = Math.floor(expirationTime / 1000)
                return embeds.error(interaction, 'Cooldown', `Du kannst den ${command.name} Befehl erst wieder ${timeLeft} benutzen.`, true)
            }
        }
        
        timestamps.set(interaction.user.id, now)
        setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount)

        //Battlelock
        if(client.battles.find(b => b.user1.id == interaction.user.id || b.user2.id == interaction.user.id) && command.battlelock) return interaction.error('Kampfsperre', 'Du kannst diesen Befehl nicht während eines Kampfes anwenden.', true)

        //Execute
        try {
            let argsarray = JSON.stringify(args)
            let d = new Date()
            console.log(`${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} | ${interaction.user.tag} | ID: ${interaction.user.id} | ${interaction.guild.name} | ID: ${interaction.guild.id} | ${command.name} | ${argsarray.replaceAll('":', ':').replaceAll('",', ',').replaceAll('"', ' ')}`)
            if(interaction.color.normal === 'role') interaction.color.normal = interaction.guild.members.me.displayHexColor || 0x00b99b
            let ex = true
            if(command.before) ex = await command.before(interaction, args, client)
            if(ex !== false) await command.execute(interaction, args, client)
        } catch (error) {
            console.error(error)
            return embeds.error(interaction, 'Fehler', 'Beim Ausführen des Commands ist ein unbekannter Fehler aufgetreten.\nBitte probiere es später erneut.', true, true)
        }
    })
}