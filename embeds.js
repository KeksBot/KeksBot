const discord = require('discord.js')
const emotes = require('./emotes.json')
const config = require('./config.json')
const delay = require('delay')
const color = {
    red: 0xff0000,
    lightblue: 0x3498db,
    lime: 0x2ecc71,
    yellow: 0xf1c40f,
    normal: 0x00b99b
}

const translatepermission = (p) => {
    p = p.toUpperCase()
    if(p === 'ADMINISTRATOR') p = 'Administrator'
    else if(p === 'CREATE_INSTANT_INVITE') p = 'Einladung erstellen'
    else if(p === 'KICK_MEMBERS') p = 'Mitglieder kicken'
    else if(p === 'BAN_MEMBERS') p = 'Mitglieder bannen'
    else if(p === 'MANAGE_CHANNELS') p = 'Kanäle verwalten'
    else if(p === 'MANAGE_GUILD') p = 'Server verwalten'
    else if(p === 'ADD_REACTIONS') p = 'Reaktionen hinzufügen'
    else if(p === 'VIEW_AUDIT_LOG') p = 'Audit-Log einsehen'
    else if(p === 'PRIORITY_SPEAKER') p = 'Very Important Speaker'
    else if(p === 'STREAM') p = 'Video'
    else if(p === 'VIEW_CHANNEL') p = 'Kanäle ansehen'
    else if(p === 'SEND_MESSAGES') p = 'Nachrichten senden'
    else if(p === 'SEND_TTS_MESSAGES') p = 'Text-zu-Sprache-Nachrichten senden'
    else if(p === 'MANAGE_MESSAGES') p = 'Nachrichten verwalten'
    else if(p === 'EMBED_LINKS') p = 'Links einbetten'
    else if(p === 'ATTACH_FILES') p = 'Dateien anhängen'
    else if(p === 'READ_MESSAGE_HISTORY') p = 'Nachrichtenverlauf anzeigen'
    else if(p === 'MENTION_EVERYONE') p = 'Erwähne @everyone, @here und "Alle Rollen"'
    else if(p === 'USE_EXTERNAL_EMOJIS') p = 'Externe Emojis verwenden'
    else if(p === 'VIEW_GUILD_INSIGHTS') p = 'Server-Einblicke anzeigen'
    else if(p === 'CONNECT') p = 'Verbinden'
    else if(p === 'SPEAK') p = 'Sprechen'
    else if(p === 'MUTE_MEMBERS') p = 'Mitglieder stummschalten'
    else if(p === 'DEAFEN_MEMBERS') p = 'Ein- und Ausgabe von Mitgliedern deaktivieren'
    else if(p === 'MOVE_MEMBERS') p = 'Mitglieder verschieben'
    else if(p === 'USE_VAD') p = 'Sprachaktivierung verwenden'
    else if(p === 'CHANGE_NICKNAME') p = 'Nickname ändern'
    else if(p === 'MANAGE_NICKNAMES') p = 'Nicknames verwalten'
    else if(p === 'MANAGE_ROLES') p = 'Rollen verwalten'
    else if(p === 'MANAGE_WEBHOOKS') p = 'WebHooks verwalten'
    else if(p === 'MANAGE_EMOJIS_AND_STICKERS') p = 'Emojis verwalten'
    else if(p === 'USE_APPLICATION_COMMANDS') p = 'Anwendungsbefehle verwenden'
    else if(p === 'REQUEST_TO_SPEAK') p = 'Redeanfrage'
    else if(p === 'MANAGE_THREADS') p = 'Threads verwalten'
    else if(p === 'USE_PUBLIC_THREADS') p = 'Öffentliche Threads verwenden'
    else if(p === 'USE_PRIVATE_THREADS') p = 'Private Threads verwenden'
    else if(p === 'USE_EXTERNAL_STICKERS') p = 'Externe Sticker verwenden'
    return p
}

const getColors = async (guild) => {
    const guilddata = await require('./db/getData')('serverdata', guild.id)
    if(guilddata && guilddata.theme) {
        let {
            red = 0xff0000,
            lightblue = 0x3498db,
            lime = 0x2ecc71,
            yellow = 0xf1c40f,
            normal = 0x00b99b
        } = guilddata.theme
        const color = {
            red,
            yellow,
            lime,
            normal,
            lightblue
        }
        return color
    } else {
        const color = {
            red: 0xff0000,
            lightblue: 0x3498db,
            lime: 0x2ecc71,
            yellow: 0xf1c40f,
            normal: 0x00b99b
        }
        return color
    }
}

module.exports = {
    /**
     * 
     * @param {discord.Message} msg 
     * @param {string} title 
     * @param {string} text 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async errorMessage(msg, title, text, edit, keep) {
        const color = await getColors(msg)
        var embed = new discord.MessageEmbed()
            .setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            .setColor(color.red)
            .setTitle(`${emotes.denied} ${title}`)
            .setDescription(text)
        if(!edit) {
            embed.setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            var message = await msg.channel.send({embeds: [embed], components: []})
        }
        else var message = await msg.edit({embeds: [embed], components: []}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} title Titel des Embeds
     * @param {string} description Textinhalt des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <discord.Interaction>} Die Interaction vom Anfang
     */
    async error(ita, title, description, ephemeral, del) {
        const color = await getColors(ita.guild)
        let embeds = [new discord.MessageEmbed()
            .setColor(color.red)
            .setTitle(`${emotes.denied} ${title}`)
            .setDescription(`${description}`)]
        if(!ephemeral) embeds[0].setFooter(ita.user.tag, ita.user.avatarURL({dynamic: true}))
        if(ita.deferred || ita.replied) await ita.editReply({ embeds, ephemeral, components: [] })
        else await ita.reply({ embeds, ephemeral })
        if(!ephemeral && del) {
            await delay(7500)
            await ita.deleteReply().catch()
        }
        return Promise.resolve(ita)
    },
    /**
     * 
     * @param {discord.Message} msg 
     * @param {discord.Permissionstring} permission 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async needpermsMessage(msg, permission, edit, keep) {
        permission = translatepermission(permission)
        const color = await getColors(msg)
        var embed = new discord.MessageEmbed()
            .setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            .setColor(color.red)
            .setTitle(`${emotes.denied} Fehlende Berechtigung`)
            .setDescription(`Um diesen Befehl auszuführen, benötigst du \`${permission}\`.`)
        if(!edit) {
            embed.setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            var message = await msg.channel.send({embeds: [embed]})
        }
        else var message = await msg.edit({embeds: [embed]}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} permission Titel des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <discord.Interaction>} Die Interaction vom Anfang
     */
    async needperms(ita, permission, ephemeral, del) {
        const color = await getColors(ita.guild)
        permission = translatepermission(permission)
        let embeds = [new discord.MessageEmbed()
            .setColor(color.red)
            .setTitle(`${emotes.denied} Fehlende Berechtigung`)
            .setDescription(`Um diesen Befehl anzuwenden, benötigst du die Berechtigung \`${permission}\``)]
        if(!ephemeral) embeds[0].setFooter(ita.user.tag, ita.user.avatarURL({dynamic: true}))
        if(ita.deferred || ita.replied) await ita.editReply({ embeds, ephemeral, components: [] })
        else await ita.reply({ embeds, ephemeral })
        if(!ephemeral && del) {
            await delay(7500)
            await ita.deleteReply().catch()
        }
        return Promise.resolve(ita)
    },
    /**
     * 
     * @param {discord.Message} msg 
     * @param {string} title 
     * @param {string} text 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async successMessage(msg, title, text, edit, keep) {
        const color = await getColors(msg)
        var embed = new discord.MessageEmbed()
            .setColor(color.lime)
            .setTitle(`${emotes.accept} ${title}`)
            .setDescription(text)
        if(!edit) {
            embed.setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            var message = await msg.channel.send({embeds: [embed], components: []})
        }
        else var message = await msg.edit({embeds: [embed], components: []}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} title Titel des Embeds
     * @param {string} description Textinhalt des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <discord.Interaction>} Die Interaction vom Anfang
     */
         async success(ita, title, description, ephemeral, del) {
            const color = ita.color || await getColors(ita.guild)
            let embeds = [new discord.MessageEmbed()
                .setColor(color.lime)
                .setTitle(`${emotes.accept} ${title}`)
                .setDescription(`${description}`)]
            if(!ephemeral) embeds[0].setFooter(ita.user.tag, ita.user.avatarURL({dynamic: true}))
            if(ita.deferred || ita.replied) await ita.editReply({ embeds, ephemeral, components: [] })
            else await ita.reply({ embeds, ephemeral })
            if(!ephemeral && del) {
                await delay(7500)
                await ita.deleteReply().catch()
            }
            return Promise.resolve(ita)
        },
    /**
     * 
     * @param {discord.Message} msg 
     * @param {string} syntax 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async syntaxerror(msg, syntax, edit, keep) {
        const color = await getColors(msg)
        var embed = new discord.MessageEmbed()
            .setColor(color.red)
            .setTitle(`${emotes.denied} Syntaxfehler`)
            .setDescription(`Bitte verwende diese Syntax:\n\`${syntax}\``)
        if(!edit) {
            embed.setFooter(msg.author.tag, msg.author.avatarURL({dynamic: true}))
            var message = await msg.channel.send({embeds: [embed]})
        }
        else var message = await msg.edit({embeds: [embed]}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    }
}