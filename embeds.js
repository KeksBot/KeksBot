const discord = require('discord.js')
const emotes = require('./emotes.json')
const delay = require('delay')
const getColors = require('./subcommands/getcolor')

const translatepermission = (p) => {
    p = p.toUpperCase()
    p = 
        p == 'ADMINISTRATOR' ? p = 'Administrator' :
        p == 'CREATE_INSTANT_INVITE' ? p = 'Einladung erstellen' :
        p == 'KICK_MEMBERS' ? p = 'Mitglieder kicken' :
        p == 'BAN_MEMBERS' ? p = 'Mitglieder bannen' :
        p == 'MANAGE_CHANNELS' ? p = 'Kanäle verwalten' :
        p == 'MANAGE_GUILD' ? p = 'Server verwalten' :
        p == 'ADD_REACTIONS' ? p = 'Reaktionen hinzufügen' :
        p == 'VIEW_AUDIT_LOG' ? p = 'Audit-Log einsehen' :
        p == 'PRIORITY_SPEAKER' ? p = 'Very Important Speaker' :
        p == 'STREAM' ? p = 'Video' :
        p == 'VIEW_CHANNEL' ? p = 'Kanäle ansehen' :
        p == 'SEND_MESSAGES' ? p = 'Nachrichten senden' :
        p == 'SEND_TTS_MESSAGES' ? p = 'Text-zu-Sprache-Nachrichten senden' :
        p == 'MANAGE_MESSAGES' ? p = 'Nachrichten verwalten' :
        p == 'EMBED_LINKS' ? p = 'Links einbetten' :
        p == 'ATTACH_FILES' ? p = 'Dateien anhängen' :
        p == 'READ_MESSAGE_HISTORY' ? p = 'Nachrichtenverlauf anzeigen' :
        p == 'MENTION_EVERYONE' ? p = 'Erwähne @everyone, @here und "Alle Rollen"' :
        p == 'USE_EXTERNAL_EMOJIS' ? p = 'Externe Emojis verwenden' :
        p == 'VIEW_GUILD_INSIGHTS' ? p = 'Server-Einblicke anzeigen' :
        p == 'CONNECT' ? p = 'Verbinden' :
        p == 'SPEAK' ? p = 'Sprechen' :
        p == 'MUTE_MEMBERS' ? p = 'Mitglieder stummschalten' :
        p == 'DEAFEN_MEMBERS' ? p = 'Ein- und Ausgabe von Mitgliedern deaktivieren' :
        p == 'MOVE_MEMBERS' ? p = 'Mitglieder verschieben' :
        p == 'USE_VAD' ? p = 'Sprachaktivierung verwenden' :
        p == 'CHANGE_NICKNAME' ? p = 'Nickname ändern' :
        p == 'MANAGE_NICKNAMES' ? p = 'Nicknames verwalten' :
        p == 'MANAGE_ROLES' ? p = 'Rollen verwalten' :
        p == 'MANAGE_WEBHOOKS' ? p = 'WebHooks verwalten' :
        p == 'MANAGE_EMOJIS_AND_STICKERS' ? p = 'Emojis verwalten' :
        p == 'USE_APPLICATION_COMMANDS' ? p = 'Anwendungsbefehle verwenden' :
        p == 'REQUEST_TO_SPEAK' ? p = 'Redeanfrage' :
        p == 'MANAGE_THREADS' ? p = 'Threads verwalten' :
        p == 'USE_PUBLIC_THREADS' ? p = 'Öffentliche Threads verwenden' :
        p == 'USE_PRIVATE_THREADS' ? p = 'Private Threads verwenden' :
        p == 'USE_EXTERNAL_STICKERS' ? p = 'Externe Sticker verwenden' :
        p == 'SEND_MESSAGES_IN_THREADS' ? p = 'Nachrichten in Threads senden' :
        p == 'START_EMBEDDED_ACTIVITIES' ? p = 'Aktivitäten starten' :
        p == 'MODERATE_MEMBERS' ? p = 'Mitglieder im Timeout' : 
        p
    return p
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
        const color = await getColors(msg.guild)
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
        const color = ita.color || await getColors(ita.guild)
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
        const color = await getColors(msg.guild)
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
        const color = ita.color || await getColors(ita.guild)
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
        const color = await getColors(msg.guild)
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
        const color = await getColors(msg.guild)
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

discord.Interaction.prototype.success = async function(title, description, ephemeral, del) {
    return await module.exports.success(this, title, description, ephemeral, del)
}

discord.Interaction.prototype.error = async function(title, description, ephemeral, del) {
    return await module.exports.error(this, title, description, ephemeral, del)
}