const discord = require('discord.js')
const embeds = require('../../embeds')
const delay = require('delay')

module.exports = {
    name: 'kick',
    description: 'Kickt den ausgewählten Nutzer',
    permission: 'KICK_MEMBERS',
    options: [
        {
            name: 'member',
            description: 'Der zu kickende Nutzer',
            type: 'USER',
            required: true,
        },
        {
            name: 'reason',
            description: 'Begründung für den Kick',
            type: 'STRING',
            required: false,
        },
        {
            name: 'instant',
            description: 'Der Nutzer wird ohne Überprüfung sofort gekickt',
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
        var { guild, color } = ita
        if(!guild.me.permissions.has('KICK_MEMBERS')) return embeds.error(ita, 'Fehlende Berechtigung', 'Um diese Aktion durchzuführen, benötige ich die "Mitglieder kicken" Berechtigung.', true)
        let member
        try { member = await guild.members.fetch(args.member) } catch {}
        if(member.id == ita.member.id) return (async function() {
            let embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Es ist ja schön, wenn du gehen willst (eigentlich nicht), aber benutz doch bitte diesen Knopf hier, anstatt dich selbst zu kicken...')
                .setTitle('._.')
                .setImage('https://cdn.discordapp.com/attachments/807219797267841044/904636313544826910/unknown.png')
            ita.reply({ embeds: [embed], ephemeral: true })
        })()
        if(!member) return embeds.error(ita, 'Fehler', 'Der gesuchte Nutzer konnte nicht gefunden werden.', true)
        if(member.roles.highest.comparePositionTo(ita.member.roles.highest) > 0 && !guild.ownerId == ita.user.id) return embeds.error(ita, 'Fehlende Berechtigungen', `Deine aktuelle Rollenkonfiguration erlaubt es dir nicht, <@!${member.id}> zu kicken.`, true)
        if(!member.kickable) return embeds.error(ita, 'Fehlende Berechtigung', `Meine aktuelle Rollenkonfiguration erlaubt es nicht, <@!${member.id}> zu kicken.`, true)
        if(!guild.data.warns) guild.data.warns = []
        if(!guild.data.modactions) guild.data.modactions = 0
        var embed
        if(args.instant == 'nein' || (args.instant != 'ja' && !(guild.data.setttings?.instant_modactions & 0b0100))) {
            embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Bitte überprüfe nochmal deine Angaben und drücke dann den "Kicken" Knopf oder brich den Vorgang ab.\nNach einer Minute wird der Vorgang automatisch abgebrochen')
                .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird gekickt [Schritt 1/2]`)
                .setFooter('Du willst dieses Fenster nicht mehr sehen und direkt kicken? Verwende /kick instant:Ja, um die Überprüfung zu überspringen.')
                .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user === member.id).length}`, true)
                .addField('Begründung', (function() {
                    if(args.reason) return args.reason
                    else return '_Es liegt keine Begründung vor._'
                })(), true)
            let buttons = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Kicken')
                        .setStyle('SUCCESS')
                        .setCustomId('kick:proceed'),
                    new discord.MessageButton()
                        .setStyle('DANGER')
                        .setLabel('Abbrechen')
                        .setCustomId('kick:cancel')
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
                embed.setDescription(`<@!${member.id}> wird nicht gekickt.`)
                embed.setTitle('Vorgang abgebrochen')
                embed.setColor(color.red)
                canceled = true
                await ita.editReply({ embeds: [embed], components: [] })
            }, 7000)
            collector.on('collect', async function(interaction) {
                clearTimeout(ending)
                if(interaction.customId == 'kick:cancel') {
                    embed.setDescription(`<@!${member.id}> wird nicht gekickt.`)
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
                `${require('../../emotes.json').pinging} ${member.displayName} wird gekickt` + 
                (function() {
                    if(!args.instant) return ' [Schritt 2/2]'
                    return ''
                })()
            )
            .setDescription(
                `<@!${member.id}> wird gekickt.\nDies kann einige Zeit dauern.\n` +
                (function() {
                    if(args.reason) return `Begründung: _${args.reason}_`
                    return '_Es liegt keine Begründung vor._'
                })()
            )
        if(!ita.replied) await ita.reply({ embeds: [embed], ephemeral: true })
        else await ita.editReply({ embeds: [embed], components: [] })
        var kicked
        try {
            if(args.reason && !member.kicked) kicked = await member.kick(args.reason)
            else if(!member.kicked) kicked = await member.kick()
        } catch {}
        if(!kicked) return embeds.error(ita, 'Fehler', 'Ein unbekannter Fehler ist aufgetreten.\nBitte probiere es später erneut.', true)
        guild.data.modactions ++
        await require('../../db/update')('serverdata', guild.id, { modactions: guild.data.modactions })
        embed = new discord.MessageEmbed()
            .setColor(color.lime)
            .setTitle(`${member.user.username} wurde gekickt (Fall #${guild.data.modactions})`)
            .setDescription(
                `<@${args.member}> wurde erfolgreich gekickt.` + 
                (function() {
                    if(args.reason) return `\nBegründung: _${args.reason}_`
                    else return ''
                })()
            )
        await ita.editReply({ embeds: [embed] })
        return
    }
}
