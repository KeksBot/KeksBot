const discord = require('discord.js')
const embeds = require('../../embeds')

module.exports = {
    name: 'clear',
    permission: 'MANAGE_MESSAGES',
    description: 'Löscht Nachrichten',
    options: [
        {
            name: 'count',
            description: 'Anzahl der Nachrichten, die gelöscht werden sollen. Maximal 100',
            required: true,
            type: 'INTEGER'
        },
        {
            name: 'filter',
            description: 'Filter: Löscht nur Nachrichten von einem Nutzer/Nutzern mit einer Rolle',
            required: false,
            type: 'MENTIONABLE'
        }
    ],
    async execute(ita, args, client) {
        var { member, guild, channel, color } = ita
        if(!channel.permissionsFor(guild.me).has('MANAGE_MESSAGES')) return embeds.error(ita, 'Fehlende Berechtigung', 'Ich brauche in diesem Kanal die "Nachrichten verwalten" Berechtigung, um diesen Command zu ermöglichen.', true)
        if(!channel.permissionsFor(member).has('MANAGE_MESSAGES')) return embeds.needperms(ita, 'MANAGE_MESSAGES', true)
        if(args.count <= 0) return embeds.error(ita, 'Syntaxfehler', 'Bitte gib eine positive Zahl an.', true)
        if(args.count > 100) args.count = 100
        await channel.messages.fetch({ limit: 100, force: true })
        var messages
        var filter = true
        await guild.members.fetch()
        if(args.filter) {
            filter = await guild.members.fetch(args.filter).catch(err => {}) || await guild.roles.fetch(args.filter).catch(err => {})
            if(!filter || filter === true) return embeds.error(ita, 'Fehler', 'Der angegebene Filter konnte nicht angewandt werden.', true)
            if(filter.user) messages = channel.messages.cache.filter(m => (Date.now() - m.createdAt) < 1209600000).filter(m => m.author.id === filter.id).sort((a, b) => b.createdAt - a.createdAt)
            else messages = channel.messages.cache.filter(m => (Date.now() - m.createdAt) < 1209600000).filter(m => m.member.roles.cache.has(filter.id)).sort((a, b) => b.createdAt - a.createdAt)
        } else messages = channel.messages.cache.filter(m => (Date.now() - m.createdAt) < 1209600000).sort((a, b) => b.createdAt - a.createdAt)
        messages = messages.filter(m => !m.deleted && !m.interaction && !m.pinned).first(args.count)
        let embed = new discord.MessageEmbed()
            .setColor(color.yellow)
            .setTitle(`${require('../../emotes.json').pinging} Nachrichten werden glöscht`)
            .setDescription('Dies kann einige Zeit dauern.')
        await ita.reply({ embeds: [embed], ephemeral: true })
        var deleted = false
        try { deleted = await channel.bulkDelete(messages) } catch {}
        if(deleted) {deleted = deleted.size || false} else deleted = false 
        if(!deleted) return embeds.error(ita, 'Fehler', 'Es wurden keine Nachrichten gelöscht.\nMöglicherweise sind sie zu alt oder keine der letzten 100 Nachrichten stimmt mit dem Filter überein.', true)
        return embeds.success(ita, `${deleted} Nachricht${(function() {if(deleted != 1) return 'en'})()} gelöscht`.replaceAll('undefined', ''), `Es wurden erfolgreich ${deleted} Nachricht${(function() {if(deleted != 1) return 'en'})()} `.replaceAll('undefined', '') + 
            (function() {if(args.filter) {if(filter.user) {return `von <@!${filter.id}> `} else return `von Nutzern mit der <@&${filter.id}> Rolle `} else {return ''}})() +
            'gelöscht.', true
        )
    }
}