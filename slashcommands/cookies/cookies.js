const discord = require('discord.js')
const embeds = require('../../embeds')
const update = require('../../db/update')

module.exports = {
    name: 'cookies',
    description: 'Gibt dir Keeeeekseeee',
    options: [
        {
            name: 'count',
            description: 'Wie viele Kekse du haben willst.',
            type: 'INTEGER',
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { user, guild } = ita
        if(args < 0) return embeds.error(ita, 'Syntaxfehler', 'Bitte gib eine Zahl > 0 an.', true)
        
        if(!user.data.thismin) user.data.thismin = 0
        if(!user.data.badges) user.data.badges = {}
        if(!user.data.cookies) user.data.cookies = 0
        if(!guild.data.level) guild.data.level = 1
        if(!guild.data.thismin) guild.data.thismin = 0

        let maxuser = 128
        if(user.data.badges.partner) maxuser = 256
        if(user.data.badges.vip) maxuser = 512
        if(user.data.badges.team) maxuser = 512
        let maxguild = 2 ** (guild.data.level + 8)
        if(guild.data.partner && guild.data.partner == 1 && maxguild < 65536) maxguild = 65536
        if(guild.data.verified && maxguild < 4194304) maxguild = 4194304
        maxuser -= user.data.thismin
        maxguild -= guild.data.thismin
        if(args.count > maxuser) args.count = maxuser
        if(args.count > maxguild) args.count = maxguild

        if(maxguild == 0) return embeds.error(ita, 'Limit erreicht', 'Dieser Server ist hat sein zugewiesenes Limit diese Minute bereits erreicht.\nFüge mehr Kekse mit `/addserver` hinzu, um das Limit zu erhöhen.', true)
        if(maxuser == 0) return embeds.error(ita, 'Limit erreicht', 'Du hast dein zugewiesenes Limit diese Minute bereits erreicht.\nBitte warte einen Moment, bevor du mehr Kekse isst.', true)
        if(args.count == 0) return embeds.success(ita, 'Keine Kekse ausgeliefert', 'Herzlichen Glückwunsch, du hast keine Kekse bekommen.', true)

        user.data.cookies += args.count
        user.data.thismin += args.count
        guild.data.thismin += args.count
        await update('userdata', ita.user.id, { cookies: user.data.cookies, thismin: user.data.thismin })
        await update('serverdata', ita.guild.id, { thismin: guild.data.thismin })

        let embed = new discord.MessageEmbed()
            .setColor(ita.color.normal)
            .setTitle(`${require('../../emotes.json').cookie} Kekse ausgeliefert`)
            .setDescription(`${args.count} Kekse wurden in deinem Lager zwischengespeichert.\nDu hast aktuell ${user.data.cookies} Kekse.`)
        return await ita.reply({ embeds: [embed], ephemeral: true })
    }
}