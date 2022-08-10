const discord = require('discord.js')
const embeds = require('../../embeds')
const delay = require('delay')

module.exports = {
    name: 'ban',
    description: 'Bannt den ausgewählten Nutzer',
    permission: 'BAN_MEMBERS',
    options: [
        {
            name: 'member',
            description: 'Der zu bannende Nutzer',
            type: 'USER',
            required: true,
        },
        {
            name: 'deletion',
            description: 'In welchem Zeitraum Nachrichten gelöscht werden. Muss zwischen 0 und 7 liegen.',
            type: 'INTEGER',
            required: true
        },
        {
            name: 'reason',
            description: 'Begründung für den Ban',
            type: 'STRING',
            required: false,
        },
        {
            name: 'time',
            description: 'Für temporäre Bans: 1y = 1 Jahr; 1M = 1 Monat; 1w = 1 Woche; etc. Bsp: 1M 10d ➜ 1 Monat, 10 Tage',
            type: 'STRING',
            required: false
        },
        {
            name: 'instant',
            description: 'Der Nutzer wird ohne Überprüfung sofort gebannt',
            type: 'STRING',
            required: false,
            choices: [
                {
                    name: 'Ja',
                    value: 'ja'
                },
                {
                    name: 'Nein',
                    value: 'nein'
                }
            ]
        }
    ],
    /**
     * 
     * @param {discord.CommandInteraction} ita 
     * @param {Object} args 
     * @param {discord.Client} client 
     * @returns 
     */
    async execute(ita, args, client) {
        var { guild, color, user } = ita
        if(!guild.me.permissions.has('BAN_MEMBERS')) return embeds.error(ita, 'Fehlende Berechtigung', 'Um diese Aktion durchzuführen, benötige ich die "Mitglieder kicken" Berechtigung.', true)
        let member
        try { member = await guild.members.fetch(args.member) } catch {}
        if(member.id == ita.member.id) return (async function() {
            let embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Es ist ja schön, wenn du gehen willst (eigentlich nicht), aber benutz doch bitte diesen Knopf hier, anstatt dich selbst zu bannen...')
                .setTitle('._.')
                .setImage('https://cdn.discordapp.com/attachments/807219797267841044/904636313544826910/unknown.png')
            ita.reply({ embeds: [embed], ephemeral: true })
        })()
        if(!member) return embeds.error(ita, 'Fehler', 'Der gesuchte Nutzer konnte nicht gefunden werden.', true)
        if(member.roles.highest.comparePositionTo(ita.member.roles.highest) > 0 && !guild.ownerId == ita.user.id) return embeds.error(ita, 'Fehlende Berechtigungen', `Deine aktuelle Rollenkonfiguration erlaubt es dir nicht, <@!${member.id}> zu bannen.`, true)
        if(!member.bannable) return embeds.error(ita, 'Fehlende Berechtigung', `Meine aktuelle Rollenkonfiguration erlaubt es nicht, <@!${member.id}> zu bannen.`, true)
        if(!guild.data.warns) guild.data.warns = []
        if(!guild.data.modactions) guild.data.modactions = 0
        var embed
        var time = 0
        let timeparts = args.time?.split(/ +/) || []
        timeparts.forEach(data => {
            time +=
                data.toLowerCase().endsWith('y') ? parseInt(data) * 1000 * 60 *60 * 24 * 365 :
                data.endsWith('M') ? parseInt(data) * 1000 * 60 * 60 * 24 * 30 :
                data.toLowerCase().endsWith('w') ? parseInt(data) * 1000 * 60 * 60 * 24 * 7 :
                data.toLowerCase().endsWith('d') ? parseInt(data) * 1000 * 60 * 60 * 24 :
                data.toLowerCase().endsWith('h') ? parseInt(data) * 1000 * 60 * 60 :
                data.endsWith('m') ? parseInt(data) * 1000 * 60 :
                data.toLowerCase().endsWith('s') ? parseInt(data) * 1000 : 0
        })
        time = new Date(Date.now() + time)
        if(args.deletion < 0) args.deletion = 0
        else if(args.deletion > 7) args.deletion = 7
        if(args.time && time <= Date.now()) return embeds.error(ita, 'Fehler', 'Es konnte kein Datum ermittelt werden oder es liegt in der Vergangenheit.', true)
        let instant = !(args.instant == 'nein' || (args.instant != 'ja' && !(guild.data.settings?.instant_modactions & 0b1000)))
        if(!instant) {
            embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Bitte überprüfe nochmal deine Angaben und drücke dann den "Bannen" Knopf oder brich den Vorgang ab.\nNach einer Minute wird der Vorgang automatisch abgebrochen')
                .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird gebannt [Schritt 1/2]`)
                .setFooter(
                    'Du willst dieses Fenster nicht mehr sehen und direkt bannen? Verwende /ban instant:Ja, um die Überprüfung zu überspringen.' +
                    (function() {
                        if(args.time) return '\nAus Performancegründen können beim Entbannen Verzögerungen von bis zu 5 Minuten auftreten.'
                        return ''
                    })()
                    )
                .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user === member.id).length}`, true)
                .addField('Begründung', (function() {
                    if(args.reason) return args.reason
                    else return '_Es liegt keine Begründung vor._'
                })(), true)
                .addField('Zeit', (function () {
                    if(args.time) return `${member.displayName} wird am <t:${Math.floor(time / 1000)}:D> gegen <t:${Math.floor(time / 1000)}:t> entbannt.`
                    else return `_${member.displayName} wird nicht automatisch entbannt._`
                })(), true)
                .addField('Nachrichtenlöschung', (function() {
                    if(!args.deletion) return `Es werden keine Nachrichten von ${member.displayName} gelöscht.`
                    if(args.deletion == 1) return `Es werden alle Nachrichten der letzten 24 Stunden von ${member.displayName} gelöscht.`
                    else return `Es werden alle Nachrichten der vergangenen ${args.deletion} Tage von ${member.displayName} gelöscht.`
                })(), true)
            let buttons = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Bannen')
                        .setStyle('SUCCESS')
                        .setCustomId('ban:proceed'),
                    new discord.MessageButton()
                        .setStyle('DANGER')
                        .setLabel('Abbrechen')
                        .setCustomId('ban:cancel')
                )
            await ita.reply({ embeds: [embed], ephemeral: true, components: [buttons] })
            var message = await ita.fetchReply()
            let collector = message.createMessageComponentCollector({ time: 60000, max: 1 })
            var waiting = true
            var canceled = false
            var ending = setTimeout(async function() {
                embed.setColor(0xfefefe)
                ita.editReply({ embeds: [embed] })
                await delay(1000)
                embed.setColor(color.yellow)
                ita.editReply({ embeds: [embed] })
                await delay(1000)
                embed.setColor(0xfefefe)
                ita.editReply({ embeds: [embed] })
                await delay(1000)
                embed.setDescription(`<@!${member.id}> wird nicht gebannt.`)
                embed.setTitle('Vorgang abgebrochen')
                embed.setColor(color.red)
                canceled = true
                await ita.editReply({ embeds: [embed], components: [] })
                waiting = false
            }, 7000)
            collector.on('collect', async function(interaction) {
                clearTimeout(ending)
                if(interaction.customId == 'ban:cancel') {
                    embed.setDescription(`<@!${member.id}> wird nicht gebannt.`)
                    embed.setTitle('Vorgang abgebrochen')
                    embed.setColor(color.red)
                    canceled = true
                    await ita.editReply({ embeds: [embed], components: [] })
                }
                waiting = false
            })
            while(waiting) {await delay(50)}
            if(canceled) return
        }
        embed = new discord.MessageEmbed()
            .setColor(color.yellow)
            .setTitle(
                `${require('../../emotes.json').pinging} ${member.displayName} wird gebannt` + 
                (function() {
                    if(!instant) return ' [Schritt 2/2]'
                    return ''
                })()
            )
            .setDescription(
                `<@!${member.id}> wird gebannt.\nDies kann einige Zeit dauern.\n` +
                (function() {
                    if(args.reason) return `Begründung: _${args.reason}_`
                    return '_Es liegt keine Begründung vor._'
                })()
            )
        if(!ita.replied) await ita.reply({ embeds: [embed], ephemeral: true })
        else await ita.editReply({ embeds: [embed], components: [] })

        //DM Information
        if(guild.data.settings?.dm_users & 0b1000) {
            embed = new discord.MessageEmbed()
                .setColor(color.red)
                .setTitle(`Du wurdest gebannt (Fall #${guild.data.modactions})`)
                .setDescription(`Du wurdest von ${guild.name} gebannt.\nZuständiger Moderator: ${ita.user.username}`)
                .addField('Begründung', (function() {
                    if(args.reason) return `${args.reason}`
                    return '_Es liegt keine Begründung vor._'
                })(), true)
                if(args.time) embed.addField('Automatische Aufhebung', `Du wirst <t:${Math.floor(time / 1000)}:R> (<t:${Math.floor(time / 1000)}>) automatisch entbannt.`, true)
            try { await (await member.user.createDM()).send({ embeds: [embed] })} catch (err) { throw err }
        }

        //bannen
        var banned
        try {
            banned = await member.ban({ days: args.deletion, reason: args.reason })
        } catch {}
        if(!banned) return embeds.error(ita, 'Fehler', 'Ein unbekannter Fehler ist aufgetreten.\nBitte probiere es später erneut.', true)
        guild.data.modactions ++
        if(!guild.data.tempbans) guild.data.tempbans = []
        var ban
        if(time) ban = {
            user: member.id,
            time
        }
        if(ban) guild.data.tempbans.push(ban)
        if(!guild.data.modlog) guild.data.modlog = []
        guild.data.modlog.push({
            type: 'ban',
            user: member.id,
            moderator: user.id,
            id: guild.data.modactions,
            reason: args.reason,
            time: Date.now()
        })
        await require('../../db/update')('serverdata', guild.id, { modactions: guild.data.modactions, tempbans: guild.data.tempbans, modlog: guild.data.modlog })
        embed = new discord.MessageEmbed()
            .setColor(color.lime)
            .setTitle(`${member.user.username} wurde gebannt (Fall #${guild.data.modactions})`)
            .setDescription(
                `<@${args.member}> wurde erfolgreich gebannt.` + 
                (function() {
                    if(args.reason) return `\nBegründung: _${args.reason}_`
                    else return ''
                })()
            )
            .addField('Zeit', (function () {
                if(args.time) return `${member.user.username} wird am <t:${Math.floor(time / 1000)}:D> gegen <t:${Math.floor(time / 1000)}:t> entbannt.`
                else return `_${member.user.username} wird nicht automatisch entbannt._`
            })(), true)
        await ita.editReply({ embeds: [embed] })
        if(time < Date.now() + 3600000) setTimeout(async function() {
            if(!await guild.bans.fetch(member.user.id)) return
            try { guild.bans.remove(member.user.id, 'Automatische Aufhebung des Bans') } catch {}
        }, time - Date.now())
        return
    }
}