const discord = require('discord.js')
const embeds = require('../../embeds')
const emotes = require('../../emotes.json')

module.exports = {
    name: 'userinfo',
    description: 'Zeigt Informationen zu einem bestimmten Nutzer an',
    options: [
        {
            name: 'user',
            description: 'Anzuzeigender Nutzer',
            type: 'USER',
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { color, guild, member } = ita
        if(args.user === ita.user.id) var user = ita.member
        else {
            var user = await guild.members.fetch(args.user)
            if(!user) return embeds.error(ita, 'Fehler', 'Der Nutzer konnte nicht gefunden werden.', true)    
        }
        user.data = await require('../../db/getData')('userdata', user.id)
        if(!user.data) user.data = {}
        var roles = user.roles.cache.array()
        roles.sort((a, b) => {
            return a.comparePositionTo(b) * -1
        })
        for (const index of roles) {
            roles[index] = `<@&${roles[index]}>`
        }
        var embed = new discord.MessageEmbed()
            .setColor(color.normal)
            .setTitle(
                (function() {if(user.data.badges && user.data.badges.partner) {return `${require('../../emotes.json').partnerlogo} `} else return ''})() +
                user.user.username)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 512, format: 'png' }))
            .setDescription(`Hier sind ein paar Informationen über <@!${user.id}>`)
            .addField('ID', user.id, true)
            .addField('Serverbeitritt', `<t:${Math.floor(user.joinedAt/1000)}>\n<t:${Math.floor(user.joinedAt/1000)}:R>`, true)
            .addField('Account erstellt', `<t:${Math.floor(user.user.createdAt/1000)}>\n<t:${Math.floor(user.user.createdAt/1000)}:R>`, true)
            .addField('Rollen', roles.join(' '))
        if(user.data.cookies) embed.addField('Lagerstand', user.data.cookies.toString(), true)
        if(user.data.xp) embed.addField('Erfahrungspunkte', user.data.xp.toString(), true)
        if(user.data.level) embed.addField('Level', user.data.level.toString(), true)
        if(user.data.badges) {
            let badges = []
            if(user.data.badges.mod) badges.push(emotes.mod)
            if(user.data.badges.dev) badges.push(emotes.dev)
            if(user.data.badges.team) badges.push(emotes.team)
            if(user.data.badges.verified) badges.push(emotes.verified)
            if(user.data.badges.partner) badges.push(emotes.partner)
            if(user.data.badges.beta) badges.push(emotes.firsthour)
            if(badges.length) embed.addField('Badges', badges.join(' '), true)
        }
        if(member.permissions.has('MODERATE_MEMBERS')) {
            let button = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Modlogs herunterladen')
                        .setStyle('SECONDARY')
                        .setCustomId('userinfo:downloadmodlogs')
                )
            let message = await ita.reply({ embeds: [embed], components: [button], ephemeral: true, fetchReply: true })
            message.awaitMessageComponent({ componentType: 'BUTTON', time: 60000 })
                .then(async interaction => {
                    if(interaction.customId == 'userinfo:downloadmodlogs') {
                        embed.setColor(color.yellow)
                        embed.setFooter('Modlogs werden geladen...\nDies kann einige Zeit dauern.')
                        await interaction.update({ embeds: [embed], components: [] })
                        let modlogs = await guild.data.modlog?.filter(modlog => modlog.user == user.id)
                        if(!modlogs?.length) return embeds.error(ita, 'Fehler', 'Keine Modlogs vorhanden', true)
                        let modlogsString = `KeksBot Modlogs für ${guild.name}\nAngewandter Filter: User = ${user.user.tag}\n\n`
                        modlogs = modlogs.sort((a, b) => a.id - b.id)
                        modlogsString += modlogs.map((modlog) => `Eintrag #${modlog.id}:\nAktion: ${modlog.type.replace('warning', 'Warnung').replace('kick', 'Kick').replace('ban', 'Ban').replace('mute', 'Timeout').replace('unmute', 'Timeout aufgehoben')}\nDatum: ${new Date(modlog.time).toLocaleString()}${modlog.reason ? `\nBegründung: ${modlog.reason}` : ''}`).join('\n\n==========\n\n').trim()
                        embed.setFooter('')
                        embed.setColor(color.lime)
                        await interaction.editReply({ embeds: [embed], components: [], files: [new discord.MessageAttachment().setFile(Buffer.from(modlogsString, 'utf8'), `modlogs-${guild.name.toLowerCase().replaceAll(/\W+/g, '-')}-${user.user.username}.txt`)] })
                    }
                })
        } else return await ita.reply({ embeds: [embed], ephemeral: true })
    }
}