const discord = require('discord.js')
const embeds = require('../../embeds')

module.exports = {
    name: 'serverinfo',
    description: 'Zeigt Informationen zu diesem Server an.',
    async execute(ita, args, client) {
        var { guild, color } = ita
        var embed = new discord.MessageEmbed()
            .setColor(color.normal)
            .setTitle(
                (function() {if(guild.data.verified) {return `${require('../../emotes.json').verifiedserver} `} else {return ''}})() +
                (function() {if(guild.data.partner && guild.data.partner == 1) {return `${require('../../emotes.json').partnerserver} `} else {return ''}})() +
                guild.name
            )
            .setThumbnail(guild.iconURL({ size: 512, dynamic: true, format: 'png' }))
            .addField('ID', guild.id, true)
            .addField('Erstellt am', `<t:${Math.floor(guild.createdAt/1000)}>\n<t:${Math.floor(guild.createdAt/1000)}:R>`, true)
            .addField('Owner', `<@!${guild.ownerId}>`, true)
            .addField('Mitglieder', guild.memberCount.toString(), true)
            .addField('Nutzer', await (await guild.members.fetch({ cache: false })).filter(m => !m.user.bot).size.toString(), true)
            .addField('Bots', await (await guild.members.fetch({ cache: false })).filter(m => m.user.bot).size.toString(), true)
            .addField('Verifizierungsstufe', (function() {
                switch(guild.verificationLevel) {
                    case 'NONE': return '⚪ Keine'
                    case 'LOW': return '🟢 Niedrig'
                    case 'MEDIUM': return '🟡 Mittel'
                    case 'HIGH': return '🟠 Hoch'
                    case 'VERY_HIGH': return '🔴 Höchste'
                    default: return '⚫ Unbekannt'
                }
            })(), true)
        if(guild.premiumSubscriptionCount) embed.addField('Server Boost', `Level: ${(function() {
            switch(guild.premiumTier) {
                case 'NONE': return 0
                case 'TIER_1': return 1
                case 'TIER_2': return 2
                case 'TIER_3': return 3
                default: return 'Unbekannt'
            }
        })()}\nBoosts: ${guild.premiumSubscriptionCount}`, true)
        if(guild.banner) embed.setImage(guild.bannerURL({ size: 512, format: 'png' }))
        if(guild.data.xp) embed.addField('Erfahrungspunkte', guild.data.xp.toString(), true)
        if(guild.data.level) embed.addField('Level', guild.data.level.toString(), true)
        return await ita.reply({ embeds: [embed], ephemeral: true })
    }
}