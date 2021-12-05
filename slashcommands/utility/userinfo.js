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
        var { color, guild } = ita
        if(args.user === ita.user.id) var user = await guild.members.fetch(ita.user.id)
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
        return await ita.reply({ embeds: [embed], ephemeral: true })
    }
}