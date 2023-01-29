import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'
import delay from 'delay'

import embeds from './embeds'
import getcolors from './subcommands/getcolor'
import getData from './db/getData'
import update from './db/update'
import handleError from './subcommands/handleError'

export default async (client: Discord.Client) => {
    client.commands = new Discord.Collection()
    client.cooldowns = new Discord.Collection()
    client.thismin = new Discord.Collection()

    const readCommands: any = async (dir: string) => {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for(const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file))
            if(stat.isDirectory()) {
                await readCommands(path.join(dir, file))
            } else {
                if(file.endsWith('.js') && !file.startsWith('!')) {
                    let { default: command } = await import(path.join(__dirname, dir, file))
                    if(!command?.name) continue
                    if(command.permission) {
                        command.permission = command.permission.toUpperCase()
                    }
                    client.commands.set(command.name, command)
                    console.log(`[${client.user.username}]: ${command.name} wurde geladen.`)
                }
            }
        }
        return
    }
    console.log(`[${client.user.username}]: Commands werden geladen.`)
    await readCommands('./slashcommands')
    console.log(`[${client.user.username}]: Commands geladen.`)

    //@ts-ignore
    client.on('interactionCreate', async function(interaction: Discord.CommandInteraction) {
        //Commandhandling
        if(interaction.type != Discord.InteractionType.ApplicationCommand) return
        
        let command = client.commands.get(interaction.commandName)
        if(!command) {
            return embeds.error(interaction, 'Fehler', 'Der Befehl wurde nicht gefunden.', true, true)
        }
        let args: any = {}
        //@ts-ignore
        interaction.options._hoistedOptions.forEach(option => args[option.name.replaceAll('-', '_')] = option.attachment || option.value)
        //@ts-ignore
        if(interaction.options.getSubcommand(false) || false) args.subcommand = interaction.options.getSubcommand(false)
        //@ts-ignore
        if(interaction.options.getSubcommandGroup(false) || false) args.subcommandgroup = interaction.options.getSubcommandGroup(false)

        if(!interaction.guild.available) return

        //let newUser = false
        let tempdata: any = await getData('server', interaction.guild.id)
        if(!tempdata) tempdata = await update('server', interaction.guild.id, {})
        interaction.guild.data = {...tempdata}
        interaction.color = await getcolors(interaction.guild)
        tempdata = await getData('user', interaction.user.id)
        if(!tempdata) tempdata = await update('user', interaction.user.id, {})
        interaction.user.data = tempdata
        if(tempdata.banned) {
            if(tempdata.banned > Date.now()) {
                let reason = '_Es liegt keine Begründung vor._'
                if(tempdata.banReason) reason = `Begründung: _${tempdata.banReason}_`
                let timestamp = ''
                if(tempdata.banned != -1) timestamp = `\n\nDer Bann wird <t:${Math.round(tempdata.banned.time / 1000)}:R> aufgehoben.`
                while(!interaction.color) {await delay(50)}
                return embeds.error(interaction, 'Nutzung verboten', `Du wurdest von der KeksBot Nutzung gebannt.\n${reason}\n\nSolltest du Fragen zu diesem Fall haben, wende dich bitte an das [KeksBot Team](discord.gg/g8AkYzWRCK).${timestamp}`, true)
            }
            if(tempdata.banned != -1 && tempdata.banned < Date.now()) {
                delete tempdata.banned
                interaction.user.data = tempdata
                await update('user', interaction.user.id, { banned: null })
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
        if(client.battles.find(b => b.users.has(interaction.user.id) && b.started) && command.battlelock) return interaction.error('Kampfsperre', 'Du kannst diesen Befehl nicht während eines Kampfes anwenden.', true)

        //Execute
        try {
            let argsarray = JSON.stringify(args, null, 1).replaceAll(/\n|\t|\r/g, ' ').replaceAll(/ +/g, ' ')
            let d = new Date()
            console.log(`${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()} ${d.getHours()}:${d.getMinutes()}:${d.getSeconds()} | ${interaction.user.tag} | ID: ${interaction.user.id} | ${interaction.guild.name} | ID: ${interaction.guild.id} | ${command.name} | ${argsarray.replaceAll('"', '')}`)
            let execute = true
            if(command.before) execute = await command.before(interaction, args, client)
            try {
                if(execute !== false) await command.execute(interaction, args, client)
            } catch (error) {
                await handleError(interaction, error, args)
            }
        } catch (error) {
            console.error(error)
            return embeds.error(interaction, 'Fehler', 'Beim Ausführen des Commands ist ein unbekannter Fehler aufgetreten.\nBitte probiere es später erneut.', true, true)
        }
    })
}