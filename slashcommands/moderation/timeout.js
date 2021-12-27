const discord = require('discord.js')
const embeds = require('../../embeds')
const delay = require('delay')
const { getData, update } = require('../../db/all')

module.exports = {
    name: 'timeout',
    description: 'Mutet den ausgewählten Nutzer',
    permission: 'MODERATE_MEMBERS',
    options: [
        {
            name: 'member',
            description: 'Der zu (ent)mutende Nutzer',
            type: 'USER',
            required: true
        },
        {
            name: 'reason',
            description: 'Begründung für das Timeout',
            type: 'STRING',
            required: false
        },
        {
            name: 'time',
            description: 'Dauer des Timeouts: 1y = 1 Jahr; 1M = 1 Monat; 1w = 1 Woche; etc. Bsp: 1h 10m ➜ 70 Minuten',
            type: 'STRING',
            required: false
        },
        {
            name: 'unmute',
            description: '"Ja", wenn das Timeout aufgehoben werden soll. Nicht kompatibel mit "time" und "reason"',
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
    async execute(ita, args, client) {
        var { user, guild, color } = ita
        if(!ita.channel.permissionsFor(guild.me).has('MODERATE_MEMBERS')) return embeds.error(ita, 'Keine Berechtigung', 'Ich habe in diesem Kanal keine Berechtigung, Mitglieder zu moderieren.', true)
        var member
        try { member = await guild.members.fetch(args.member) } catch (err) {}
        if(!member) return embeds.error(ita, 'Fehler', 'Der angegebene Nutzer konnte nicht gefunden werden.', true)
        if(!member.moderatable) return embeds.error(ita, 'Keine Berechtigung', `Ich kann <@!${member.id}> aufgrund der Rolleneinstellungen/-hierarchie nicht moderieren.`, true)

        //time
        var time = 0
        args.time?.split(/ +/).forEach(data => {
            time +=
                data.toLowerCase().endsWith('y') ? parseInt(data) * 1000 * 60 *60 * 24 * 365 :
                data.endsWith('M') ? parseInt(data) * 1000 * 60 * 60 * 24 * 30 :
                data.toLowerCase().endsWith('w') ? parseInt(data) * 1000 * 60 * 60 * 24 * 7 :
                data.toLowerCase().endsWith('d') ? parseInt(data) * 1000 * 60 * 60 * 24 :
                data.toLowerCase().endsWith('h') ? parseInt(data) * 1000 * 60 * 60 :
                data.endsWith('m') ? parseInt(data) * 1000 * 60 :
                data.toLowerCase().endsWith('s') ? parseInt(data) * 1000 : 0
        })

        //Nachfragen
        if(args.instant != 'ja' ) {
            let embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setDescription('Bitte überprüfe nochmal deine Angaben und drücke dann den "Weiter" Knopf oder brich den Vorgang ab.\nNach einer Minute wird der Vorgang automatisch abgebrochen')
                .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird gemutet [Schritt 1/2]`)
                .setFooter('Du willst dieses Fenster nicht mehr sehen und direkt muten? Verwende /timeout instant:Ja, um die Überprüfung zu überspringen.')
                .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user == member.id).length}`, true)
            if(args.unmute == 'ja') {
                embed.setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird entmutet [Schritt 1/2]`)
                    .setFooter('Du willst dieses Fenster nicht mehr sehen und direkt entmuten? Verwende /timeout instant:Ja, um die Überprüfung zu überspringen.')
            } else {
                if(!time) return embeds.error(ita, 'Fehler', 'Bitte gib eine gültige Dauer an.', true) 
                embed
                    .addField('Begründung', (function() {
                        if(args.reason) return args.reason
                        else return '_Es liegt keine Begründung vor._'
                    })(), true)
                    .addField('Dauer', `<@!${member.id}> wird <t:${Math.floor((Date.now() + time) / 1000)}:R> (<t:${Math.floor((Date.now() + time) / 1000)}>) entmutet`, true)
            }
            let buttons = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Weiter')
                        .setStyle('SUCCESS')
                        .setCustomId('timeout:proceed'),
                    new discord.MessageButton()
                        .setStyle('DANGER')
                        .setLabel('Abbrechen')
                        .setCustomId('timeout:cancel')
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
                embed.setDescription(`Es wurde keine Eingabe getätigt`)
                embed.setTitle('Vorgang abgebrochen')
                embed.setColor(color.red)
                canceled = true
                await ita.editReply({ embeds: [embed], components: [], ephemeral: true })
                waiting = false
            }, 7000)
            collector.on('collect', async function(interaction) {
                clearTimeout(ending)
                if(interaction.customId == 'timeout:cancel') {
                    embed.setDescription(`<@!${member.id}> wird nicht gemutet.`)
                        .setTitle('Vorgang abgebrochen')
                        .setColor(color.red)
                    if(args.unmute == 'ja') embed.setDescription(`<@!${member.id}> wird nicht entmutet.`)
                    canceled = true
                    await ita.editReply({ embeds: [embed], components: [], ephemeral: true})
                }
                waiting = false
            })
            while(waiting) {await delay(50)}
            if(canceled) return
        }

        //entmuten
        if(args.unmute == 'ja') {
            let embed = new discord.MessageEmbed()
                .setColor(color.yellow)
                .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird entmutet ${(
                    function () {
                        if(args.instant != 'ja') return ' [Schritt 2/2]'
                        return ''
                    }
                )()}`)
                .setDescription(`<@!${member.id}> wird entmutet.\nDies kann einige Zeit dauern.`)
                .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user == member.id).length}`, true)
            if(ita.replied) await ita.editReply({ embeds: [embed], components: [], ephemeral: true})
            else await ita.reply({ embeds: [embed], components: [], ephemeral: true})
            await member.timeout(null, `Timeout aufgehoben durch ${user.username}`)
            guild.data = await getData('serverdata', guild.id)
            await update('serverdata', guild.id, { modactions: guild.data.modactions })
            guild.data.modactions = guild.data.modactions ? guild.data.modactions + 1 : 1
            embed.setColor(color.lime)
                .setTitle(`${member.user.username} wurde entmutet (Fall #${guild.data.modactions})`)
                .setDescription(`${member} hat nun wieder Zugriff auf Text- und Sprachkanäle.`)
            return await ita.editReply({ embeds: [embed] })
        }

        //muten
        let embed = new discord.MessageEmbed()
            .setColor(color.yellow)
            .setTitle(`${require('../../emotes.json').pinging} ${member.displayName} wird gemutet ${(
                function () {
                    if(args.instant != 'ja') return ' [Schritt 2/2]'
                    return ''
                }
            )()}`)
            .addField('Nutzer', `<@!${member.id}>\nAccount erstellt <t:${Math.floor(member.user.createdAt / 1000)}:R>\nBeigetreten <t:${Math.floor(member.joinedAt / 1000)}:R>\nWarnungen: ${guild.data.warns.filter(object => object.user == member.id).length}`, true)
            .setDescription(`<@!${member.id}> wird gemutet.\nDies kann einige Zeit dauern.`)
            .addField('Begründung', (function() {
                if(args.reason) return args.reason
                else return '_Es liegt keine Begründung vor._'
            })(), true)
            .addField('Dauer', `<@!${member.id}> wird <t:${Math.floor((Date.now() + time) / 1000)}:R> (<t:${Math.floor((Date.now() + time) / 1000)}>) entmutet`, true)
        if(ita.replied) await ita.editReply({ embeds: [embed], components: [], ephemeral: true})
        else await ita.reply({ embeds: [embed], components: [], ephemeral: true })
        await member.timeout(time, `Timeout aufgehoben durch ${user.username}`)
        guild.data = await getData('serverdata', guild.id)
        await update('serverdata', guild.id, { modactions: guild.data.modactions })
        guild.data.modactions = guild.data.modactions ? guild.data.modactions + 1 : 1
        embed.setColor(color.lime)
            .setTitle(`${member.user.username} wurde gemutet (Fall #${guild.data.modactions})`)
            .setDescription(`${member} hat keinen Zugriff mehr auf Text- und Sprachkanäle.`)
        return await ita.editReply({ embeds: [embed] })
    }
}