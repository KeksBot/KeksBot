import Discord from 'discord.js'
import emotes from './emotes.json'
import delay from 'delay'
import getColors from './subcommands/getcolor'

const translatepermission = (p: string) => {
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
        p == 'CREATE_PUBLIC_THREADS' ? p = 'Öffentliche Threads erstellen' :
        p == 'CREATE_PRIVATE_THREADS' ? p = 'Private Threads erstellen' :
        p == 'USE_EXTERNAL_STICKERS' ? p = 'Externe Sticker verwenden' :
        p == 'SEND_MESSAGES_IN_THREADS' ? p = 'Nachrichten in Threads senden' :
        p == 'START_EMBEDDED_ACTIVITIES' ? p = 'Aktivitäten starten' :
        p == 'MODERATE_MEMBERS' ? p = 'Mitglieder im Timeout' : 
        p
    return p
}

const exp = {
    /**
     * 
     * @param {Discord.Message} msg 
     * @param {string} title 
     * @param {string} text 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async errorMessage(msg: Discord.Message, title: string, text: string, edit?: boolean, keep?: boolean) {
        const color = await getColors(msg.guild)
        var embed = new Discord.EmbedBuilder()
            .setColor(color.red)
            .setTitle(`${emotes.denied} ${title}`)
            .setDescription(text)
        let message
        if(!edit) {
            message = await msg.channel.send({embeds: [embed], components: []})
        }
        else message = await msg.edit({embeds: [embed], components: []}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {Discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} title Titel des Embeds
     * @param {string} description Textinhalt des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <Discord.Interaction>} Die Interaction vom Anfang
     */
    async error(ita: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.SelectMenuInteraction, title: string, description: string, ephemeral?: boolean, del?: boolean) {
        const color = ita.color || await getColors(ita.guild)
        let embeds = [new Discord.EmbedBuilder()
            .setColor(color.red)
            .setTitle(`${emotes.denied} ${title}`)
            .setDescription(`${description}`)]
        if(ita.deferred || ita.replied) await ita.editReply({ embeds, components: [] })
        else await ita.reply({ embeds, ephemeral })
        if(!ephemeral && del) {
            await delay(7500)
            await ita.deleteReply().catch()
        }
        return Promise.resolve(ita)
    },
    /**
     * 
     * @param {Discord.Message} msg 
     * @param {Discord.Permissionstring} permission 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async needpermsMessage(msg: Discord.Message, permission: string, edit?: boolean, keep?: boolean) {
        permission = translatepermission(permission)
        const color = await getColors(msg.guild)
        var embed = new Discord.EmbedBuilder()
            .setColor(color.red)
            .setTitle(`${emotes.denied} Fehlende Berechtigung`)
            .setDescription(`Um diesen Befehl auszuführen, benötigst du \`${permission}\`.`)
        let message
        if(!edit) {
            message = await msg.channel.send({embeds: [embed]})
        }
        else message = await msg.edit({embeds: [embed], components: []}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {Discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} permission Titel des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <Discord.Interaction>} Die Interaction vom Anfang
     */
    async needperms(ita: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.SelectMenuInteraction, permission: string, ephemeral?: boolean, del?: boolean) {
        const color = ita.color || await getColors(ita.guild)
        permission = translatepermission(permission)
        let embeds = [new Discord.EmbedBuilder()
            .setColor(color.red)
            .setTitle(`${emotes.denied} Fehlende Berechtigung`)
            .setDescription(`Um diesen Befehl anzuwenden, benötigst du die Berechtigung \`${permission}\``)]
        if(ita.deferred || ita.replied) await ita.editReply({ embeds, components: [] })
        else await ita.reply({ embeds, ephemeral })
        if(!ephemeral && del) {
            await delay(7500)
            await ita.deleteReply().catch()
        }
        return Promise.resolve(ita)
    },
    /**
     * 
     * @param {Discord.Message} msg 
     * @param {string} title 
     * @param {string} text 
     * @param {boolean} edit 
     * @param {boolean} keep 
     * @returns discord.Message
     */
    async successMessage(msg: Discord.Message, title: string, text: string, edit?: boolean, keep?: boolean) {
        const color = await getColors(msg.guild)
        var embed = new Discord.EmbedBuilder()
            .setColor(color.lime)
            .setTitle(`${emotes.accept} ${title}`)
            .setDescription(text)
        let message
        if(!edit) {
            message = await msg.channel.send({embeds: [embed], components: []})
        }
        else message = await msg.edit({embeds: [embed], components: []}).catch()
        await delay(7500)
        if(!keep && message.deletable) message.delete().catch()
        return Promise.resolve(message)
    },
    /**
     * 
     * @param {Discord.Interaction} ita Die Interaction, auf die geantwortet werden soll
     * @param {string} title Titel des Embeds
     * @param {string} description Textinhalt des Embeds
     * @param {boolean} [ephemeral] Ob die Nachricht nur an den Nutzer gesendet werden soll
     * @param {boolean} [del] Ob die Nachricht am Ende gelöscht werden soll
     * @returns {Promise <Discord.Interaction>} Die Interaction vom Anfang
     */
    async success(ita: Discord.CommandInteraction | Discord.ButtonInteraction | Discord.SelectMenuInteraction, title: string, description: string, ephemeral?: boolean, del?: boolean) {
        const color = ita.color || await getColors(ita.guild)
        let embeds = [new Discord.EmbedBuilder()
            .setColor(color.lime)
            .setTitle(`${emotes.accept} ${title}`)
            .setDescription(`${description}`)]
        if(ita.deferred || ita.replied) await ita.editReply({ embeds, components: [] })
        else await ita.reply({ embeds, ephemeral })
        if(!ephemeral && del) {
            await delay(7500)
            await ita.deleteReply().catch()
        }
        return Promise.resolve(ita)
    }
}

export default exp

//@ts-ignore
Discord.CommandInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.ButtonInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.SelectMenuInteraction.prototype.success = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.success(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.CommandInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.error(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.ButtonInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.error(this, title, description, ephemeral, del)
}

//@ts-ignore
Discord.SelectMenuInteraction.prototype.error = async function(title: string, description: string, ephemeral?: boolean, del?: boolean) {
    return await exp.error(this, title, description, ephemeral, del)
}