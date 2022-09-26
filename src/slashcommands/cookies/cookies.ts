import Discord from 'discord.js'
import embeds from '../../embeds'
import update from '../../db/update'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'cookies',
    description: 'Gibt dir Kekse',
    battlelock: true,
    options: [
        {
            name: 'count',
            description: 'Wie viele Kekse du haben willst',
            type: Discord.ApplicationCommandOptionType.Integer,
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { user, guild } = ita
        if(args.count < 0) return embeds.error(ita, 'Syntaxfehler', 'Bitte gib eine Zahl > 0 an.', true)
        
        if(!client.thismin.get(user.id)) client.thismin.set(user.id, 0)
        if(!user.data.badges) user.data.badges = {}
        if(!user.data.cookies) user.data.cookies = 0
        if(!guild.data.level) guild.data.level = 1
        if(!client.thismin.get(guild.id)) client.thismin.set(guild.id, 0)

        let maxuser = 
            user.data.badges.team ? 512 :
            user.data.badges.vip ? 512 :
            user.data.badges.partner ? 256 : 128

        var maxguild = 2 ** (guild.data.level + 8)
        if(guild.data.partner && guild.data.partner == 1 && maxguild < 65536) maxguild = 65536
        if(guild.data.verified && maxguild < 4194304) maxguild = 4194304

        maxuser -= client.thismin.get(user.id)
        maxguild -= client.thismin.get(guild.id)
        if(args.count > maxuser) args.count = maxuser
        if(args.count > maxguild) args.count = maxguild

        if(!maxguild) return embeds.error(ita, 'Limit erreicht', 'Dieser Server ist hat sein zugewiesenes Limit diese Minute bereits erreicht.\nFüge mehr Kekse mit `/addserver` hinzu, um das Limit zu erhöhen.', true)
        if(!maxuser) return embeds.error(ita, 'Limit erreicht', 'Du hast dein zugewiesenes Limit diese Minute bereits erreicht.\nBitte warte einen Moment, bevor du mehr Kekse isst.', true)

        user.data.cookies += args.count
        client.thismin.set(user.id, client.thismin.get(user.id) + args.count)
        client.thismin.set(guild.id, client.thismin.get(guild.id) + args.count)
        ita.user.setData({ cookies: Math.floor(user.data.cookies) })

        let embed = new Discord.EmbedBuilder()
            .setColor(ita.color.normal)
            .setTitle(`${emotes.cookie} Kekse ausgeliefert`)
            .setDescription(`${args.count} Kekse wurden in deinem Lager zwischengespeichert.\nDu hast aktuell ${user.data.cookies} Kekse.`)
        return await ita.reply({ embeds: [embed], ephemeral: true })
    }
}

export default options