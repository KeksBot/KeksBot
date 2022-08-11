import Discord from 'discord.js'
import embeds from '../../embeds'
import update from '../../db/update'

const options: CommandOptions = {
    name: 'gift',
    description: 'Schenk jemandem Kekse',
    battlelock: true,
    options: [
        {
            name: 'user',
            description: 'Der Nutzer, dem du Kekse schenken willst',
            type: Discord.ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: 'count',
            description: 'Anzahl der Kekse, die du verschenken willst',
            type: Discord.ApplicationCommandOptionType.Integer,
            required: true
        },
        {
            name: 'public',
            description: 'Sollen dein Geschenk öffentlich angezeigt werden? (Standard: Nein)',
            type: Discord.ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: 'Ja',
                    value: 'yes',
                },
                {
                    name: 'Nein',
                    value: 'no',
                }
            ]
        }
    ],
    async execute(ita, args, client) {
        var { guild, user } = ita
        var member = await guild.members.fetch(args.user)
        if (!member) return embeds.error(ita, 'Fehler', 'Der angegebene Nutzer konnte nicht gefunden werden.', true)
        if (args.count <= 0) return embeds.error(ita, 'Syntaxfehler', `Es wäre schön, wenn sich ${member.displayName} auch über dein Geschenk freuen könnte, also gib bitte eine positive Zahl an.`, true)

        member.data = await member.user.getData() || { _id: member.id }
        if (!user.data?.cookies) return embeds.error(ita, 'Fehler', 'Du hast keine Kekse, die du verschenken kannst.\nBenutz zuerst `/cookies`, um welche zu bekommen.', true)
        if (!member.data.cookies) member.data.cookies = 0

        if (args.count > user.data.cookies) args.count = user.data.cookies

        member.data.cookies += args.count
        user.data.cookies -= args.count

        await user.save()
        await member.user.setData({ cookies: member.data.cookies })

        return embeds.success(ita, 'Kekse verschenk', `Du hast <@${member.id}> ${args.count} Kekse geschenkt.`.replace(' 1 Kekse', ' einen Keks'), args.public === 'yes')
    }
}

export default options