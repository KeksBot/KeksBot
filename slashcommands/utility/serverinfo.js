const discord = require('discord.js')
const embeds = require('../../embeds')

module.exports = {
    name: 'serverinfo',
    description: 'Zeigt Informationen zu diesem Server an.',
    async execute(ita, args, client) {
        var { guild, color, member } = ita
        var embed = new discord.MessageEmbed()
            .setColor(color.normal)
            .setTitle(
                guild.data.verified ? require('../../emotes.json').verifiedserver + ' ' : '' +
                guild.data.partner == 1 ? require('../../emotes.json').partnerserver + ' ' : '' +
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
        if(member.permissions.has('MODERATE_MEMBERS')) {
            let button = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setLabel('Modlogs herunterladen')
                        .setStyle('SECONDARY')
                        .setCustomId('serverinfo:downloadmodlogs')
                )
            let message = await ita.reply({ embeds: [embed], components: [button], ephemeral: true, fetchReply: true })
            message.awaitMessageComponent({ componentType: 'BUTTON', time: 60000 })
                .then(async interaction => {
                    if(interaction.customId == 'serverinfo:downloadmodlogs') {
                        embed.setColor(color.yellow)
                        embed.setFooter('Modlogs werden geladen...\nDies kann einige Zeit dauern.')
                        await interaction.update({ embeds: [embed], components: [] })
                        let modlogs = await guild.data.modlog
                        if(!modlogs?.length) return embeds.error(ita, 'Fehler', 'Keine Modlogs vorhanden', true)
                        let modlogsString = `KeksBot Modlogs für ${guild.name}\n\n`
                        modlogs = modlogs.sort((a, b) => a.id - b.id)
                        modlogsString += modlogs.map((modlog) => `Eintrag #${modlog.id}:\nNutzer: ${modlog.user}\nAktion: ${modlog.type.replace('warning', 'Warnung').replace('kick', 'Kick').replace('ban', 'Ban').replace('mute', 'Timeout').replace('unmute', 'Timeout aufgehoben')}\nDatum: ${new Date(modlog.time).toLocaleString()}${modlog.reason ? `\nBegründung: ${modlog.reason}` : ''}`).join('\n\n==========\n\n').trim()
                        embed.setFooter('')
                        embed.setColor(color.lime)
                        await interaction.editReply({ embeds: [embed], components: [], files: [new discord.MessageAttachment().setFile(Buffer.from(modlogsString, 'utf8'), `modlogs-${guild.name.toLowerCase().replaceAll(/\W+/g, '-')}.txt`)] })
                    }
                })
        } else {
            await ita.reply({ embeds: [embed], ephemeral: true })
        }
    }
}