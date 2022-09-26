import Discord from 'discord.js'
import embeds from '../../embeds'

const options: CommandOptions = {
    name: 'addserver',
    description: 'Fügt dem Server Kekse als Erfahrungspunkte hinzu',
    battlelock: true,
    options: [
        {
            name: 'count',
            description: 'Anzahl der Kekse, die du dem Server geben willst',
            required: true,
            type: 4
        }
    ],
    async execute(ita, args, client) {
        var { guild, user, color } = ita
        if(args.count < 0) return embeds.error(ita, 'Syntaxfehler', 'Du darfst keine Kekse klauen, bitte gib eine positive Zahl an.', true)

        if(!guild.data.xp) guild.data.xp = 0
        if(!guild.data.level) guild.data.level = 1
        if(!user.data.cookies) user.data.cookies = 0
        
        if(args.count > user.data.cookies) args.count = user.data.cookies

        if(!args.count && user.data.cookies) return embeds.success(ita, 'Keine Kekse übertragen', 'Du hast dem Server keine Erfahrungspunkte gegeben. Jetzt ist er traurig :c', true)
        else if(!user.data.cookies) return embeds.success(ita, 'Fehler', 'Du hast keine Kekse D:\nBenutz zuerst `/cookies`, um welche zu bekommen.', true)

        guild.data.xp += args.count
        user.data.cookies -= args.count
        let levelup = false
        
        while (512 * ((2 ** guild.data.level) ** 2) <= guild.data.xp) {
            guild.data.level ++
            levelup = true
        }

        await user.save()
        await guild.save()

        if(levelup) {
            let embed = new Discord.EmbedBuilder()
                .setColor(color.normal)
                .setTitle('Level Up')
                .setDescription(`Dieser Server ist nun **Level ${guild.data.level}**.\nDas entspricht einem Limit von **${2 ** (guild.data.level + 8)} Keksen**, die hier pro Minute gegessen werden können.\nHerzlichen Glückwunsch!`)
            ita.channel.send({ embeds: [embed] })
        }

        let sent = `Du hast erfolgreich ${args.count} Kekse an den Server übergeben.`
        if(args.count == 1) sent = 'Du hast erfolgreich einen Keks an den Server übergeben.'
        let xp = `Darum hat dieser Server nun ${guild.data.xp} Erfahrungspunkte, es fehlen noch ${512 * ((2 ** guild.data.level) ** 2) - guild.data.xp}, um Level ${guild.data.level + 1} zu erreichen.`.replace(' 1 Erfahrungspunkte', ' einen Erfahrungspunkt').replace('fehlen noch 1,', 'fehlt noch einer,')

        return embeds.success(ita, 'Kekse übergeben', `${sent}\n${xp}`, true)        
    }
}

export default options