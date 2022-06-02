const discord = require('discord.js')
const embeds = require('../../embeds')
const getData = require('../../db/getData')
const update = require('../../db/update')

module.exports = {
    name: 'gift',
    description: 'Schenk jemandem Kekse',
    battlelock: true,
    options: [
        {
            name: 'user',
            description: 'Der Nutzer, dem du Kekse schenken willst',
            type: 'USER',
            required: true
        }, 
        {
            name: 'count',
            description: 'Anzahl der Kekse, die du verschenken willst',
            type: 'INTEGER',
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { guild, user } = ita
        var member = await guild.members.fetch(args.user)
        if(!member) return embeds.error(ita, 'Fehler', 'Der angegebene Nutzer konnte nicht gefunden werden.', true)
        if(args.count <= 0) return embeds.error(ita, 'Syntaxfehler', `Es wäre schön, wenn sich ${member.displayName} auch über dein Geschenk freuen könnte, also gib bitte eine positive Zahl an.`, true)

        member.data = await getData('userdata', member.id) ?? 0
        if(!user.data.cookies) return embeds.error(ita, 'Fehler', 'Du hast keine Kekse, die du verschenken kannst.\nBenutz zuerst `/cookies`, um welche zu bekommen.', true)
        if(!member.data.cookies) member.data.cookies = 0

        if(args.count > user.data.cookies) args.count = user.data.cookies

        member.data.cookies += args.count
        user.data.cookies -= args.count

        await update('userdata', user.id, { cookies: user.data.cookies })
        await update('userdata', member.id, { cookies: member.data.cookies })

        return embeds.success(ita, 'Kekse übertragen', `Du hast <@${member.id}> ${args.count} Kekse geschenkt.`.replace(' 1 Kekse', ' einen Keks'), true)
    }
}