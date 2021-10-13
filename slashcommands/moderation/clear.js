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
        if(!channel.permissionsFor(member).has('MANAGE_MESSAGES')) return embeds.needperms(ita, 'MANAGE_MESSAGES', true)
        if(args.count <= 0) return embeds.error(ita, 'Syntaxfehler', 'Bitte gib eine positive Zahl an.', true)
        if(args.count > 100) args.count = 100
        await channel.messages.fetch({ limit: 100 })
        var messages
        var filter = true
        if(args.filter) {
            filter = await guild.members.fetch(args.filter) || await guild.roles.fetch(args.filter)
            if(!filter || filter === true) return embeds.error(ita, 'Fehler', 'Der angegebene Filter konnte nicht angewandt werden.', true)
            if(filter.user) messages = channel.cache.messages.filter(m => m.user.id === filter.id)
            else messages = channel.messages.cache.filter(m => m.member.roles.has(filter.id))
        } else messages = channel.cache.messages
        messages = messages.first(args.count)
        let embed = new discord.MessageEmbed()
            .setColor(color.yellow)
            .setTitle(`${require('../../emotes.json').pinging} Nachrichten werden glöscht`)
            .setDescription('Dies kann einige Zeit dauern.')
        await ita.reply({ embeds: [embed], ephemeral: true })
        var deleted = false
        try { deleted = await channel.bulkDelete(messages) } catch {}
        
    }
}