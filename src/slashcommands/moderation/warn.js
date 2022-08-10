const discord = require('discord.js')
const delay = require('delay')
const update = require('../../db/update')
const getData = require('../../db/getData')
const embeds = require('../../embeds')

module.exports = {
    name: 'warn',
    description: 'Warnt den ausgewählten Nutzer',
    permission: 'MODERATE_MEMBERS',
    options: [
        {
            name: 'member',
            description: 'Der zu warnende Nutzer',
            type: 'USER',
            required: true
        },
        {
            name: 'reason',
            description: 'Begründung für die Warnung',
            type: 'STRING',
            required: false
        },
        {
            name: 'instant',
            description: 'Der Nutzer wird ohne Überprüfung sofort gewarnt',
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
    async execute(ita, args, client) {
        var { color, guild, user } = ita
        var member
        try { member = await guild.members.fetch(args.member) } catch {}
        if(!member) return embeds.error(ita, 'Fehler', 'Der angegebene Nutzer konnte nicht gefunden werden.', true)
        if(member.roles.highest.comparePositionTo(ita.member.roles.highest) > 0 && !guild.ownerId == user.id) return embeds.error(ita, 'Fehlende Berechtigungen', `Deine aktuelle Rollenkonfiguration erlaubt es dir nicht, <@!${member.id}> zu warnen.`, true)
        if(!guild.data.modactions) guild.data.modactions = 0
        guild.data.modactions ++
        let warning = {
            id: guild.data.modactions,
            user: member.id,
            moderator: user.id,
            reason: args.reason,
            type: 'warning',
            time: Date.now()
        }
        var embed
        let instant = !(args.instant == 'nein' || (args.instant != 'ja' && !(guild.data.settings?.instant_modactions & 0b1000)))
        if(!instant) {
            embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Bitte überprüfe nochmal deine Angaben und drücke dann den "Warnen" Knopf oder brich den Vorgang ab.\nNach einer Minute wird der Vorgang automatisch abgebrochen')
                .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird gewarnt [Schritt 1/2]`)
                .setFooter('Du willst dieses Fenster nicht mehr sehen und direkt warnen? Verwende /warn instant:Ja, um die Überprüfung zu überspringen.')
                .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user == member.id).length}`, true)
                .addField('Begründung', (function() {
                    if(args.reason) return args.reason
                    else return '_Es liegt keine Begründung vor._'
                })(), true)
            let buttons = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Warnen')
                        .setStyle('SUCCESS')
                        .setCustomId('warn:proceed'),
                    new discord.MessageButton()
                        .setStyle('DANGER')
                        .setLabel('Abbrechen')
                        .setCustomId('warn:cancel')
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
                embed.setDescription(`<@!${member.id}> wird nicht gewarnt.`)
                embed.setTitle('Vorgang abgebrochen')
                embed.setColor(color.red)
                canceled = true
                await ita.editReply({ embeds: [embed], components: [] })
            }, 7000)
            collector.on('collect', async function(interaction) {
                clearTimeout(ending)
                if(interaction.customId == 'warn:cancel') {
                    embed.setDescription(`<@!${member.id}> wird nicht gewarnt.`)
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
                `${require('../../emotes.json').pinging} ${member.displayName} wird gewarnt` + 
                (function() {
                    if(!instant) return ' [Schritt 2/2]'
                    return ''
                })()
            )
            .setDescription(
                `<@!${member.id}> wird gewarnt.\nDies kann einige Zeit dauern.\n` +
                (function() {
                    if(args.reason) return `Begründung: _${args.reason}_`
                    return '_Es liegt keine Begründung vor._'
                })()
            )
        if(!ita.replied) await ita.reply({ embeds: [embed], ephemeral: true })
        else await ita.editReply({ embeds: [embed], components: [] })

        //DM Information
        if(guild.data.settings?.dm_users & 0b0001) {
            embed = new discord.MessageEmbed()
                .setColor(color.red)
                .setTitle(`Du wurdest gewarnt (Fall #${guild.data.modactions})`)
                .setDescription(`Du wurdest auf ${guild.name} gewarnt.\nZuständiger Moderator: ${ita.user.username}`)
                .addField('Begründung', (function() {
                    if(args.reason) return `${args.reason}`
                    return '_Es liegt keine Begründung vor._'
                })(), true)
            try { await (await member.user.createDM()).send({ embeds: [embed] })} catch (err) { throw err }
        }

        guild.data = await getData('serverdata', guild.id)
        if(!guild.data.modlog) guild.data.modlog = []
        guild.data.modlog.push(warning)
        guild.data.modactions ++
        await update('serverdata', guild.id, { modlog: guild.data.modlog, modactions: guild.data.modactions })
        embed = new discord.MessageEmbed()
            .setColor(color.lime)
            .setTitle(`${member.user.username} wurde gewarnt (Fall #${guild.data.modactions})`)
            .setDescription(
                `<@${args.member}> wurde erfolgreich gewarnt.` + 
                (function() {
                    if(args.reason) return `\nBegründung: _${args.reason}_`
                    else return ''
                })()
            )
        await ita.editReply({ embeds: [embed] })
        return
    }
}