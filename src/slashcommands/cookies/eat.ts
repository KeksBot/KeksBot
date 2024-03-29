import Discord from 'discord.js'
import embeds from '../../embeds'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'eat',
    description: 'Konvertiert deine Kekse zu Erfahrungspunkten',
    battlelock: true,
    options: [
        {
            name: 'count',
            description: 'Anzahl der Kekse, die du essen willst',
            type: 4,
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { guild, user, color } = ita
        if(args.count <= 0) return embeds.error(ita, 'Syntaxfehler', 'Bitte gib eine positive Zahl an.')

        if(args.count > user.storage.data.cookies) args.count = user.storage.data.cookies

        if(!args.count && user.storage.data.cookies) return embeds.success(ita, 'NomNom', 'Oder auch nicht.', true)
        else if(!user.storage.data.cookies) return embeds.error(ita, 'Fehler', 'Du kannst keine Kekse essen D:\nBenutz zuerst `/cookies`, um welche zu bekommen.', true)

        user.storage.data.xp += args.count
        user.storage.data.cookies -= args.count
        let levelup = false
        let scanning = true
        let neededxp = 0
        let levelcount = 0

        while (scanning) {
            if(user.storage.data.level <= 15 && (user.storage.data.level + 1) ** 3 * ((24 + Math.floor((user.storage.data.level + 2) / 3)) / 3) <= user.storage.data.xp) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else if(user.storage.data.level <= 36 && user.storage.data.level > 15 && (user.storage.data.level + 1) ** 3 * ((15 + user.storage.data.level) / 3) <= user.storage.data.xp) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else if(user.storage.data.level < 100 && user.storage.data.level > 37 && (user.storage.data.level + 1) ** 3 * ((32 + Math.floor((user.storage.data.level + 1) / 2)) / 3)) {
                user.storage.data.level++
                levelup = true
                levelcount++
            } else scanning = false
        }

        neededxp = 
            (user.storage.data.level <= 15) ? Math.ceil((user.storage.data.level + 1) ** 3 * ((24 + Math.floor((user.storage.data.level + 2) / 3)) / 3)) : 
            (user.storage.data.level <= 36) ? Math.ceil((user.storage.data.level + 1) ** 3 * ((15 + user.storage.data.level) / 3)) :
            (user.storage.data.level < 100) ? Math.ceil((user.storage.data.level + 1) ** 3 * ((32 + Math.floor((user.storage.data.level + 1) / 2)) / 3)) :
            user.storage.data.xp

        await user.save()

        let embed = new Discord.EmbedBuilder()
        if(levelup) {
            client.emit('userLevelUp', ita, levelcount)
        } else {
            embed
                .setColor(color.lime)
                .setTitle(`${emotes.accept} Kekse gegessen`)
                .setDescription(`Du hast ${args.count} Kekse gegessen.\nDadurch hast du nun ${user.storage.data.xp} Erfahrungspunkte. Es fehlen noch ${neededxp - user.storage.data.xp} Erfahrungspunkte, um Level ${user.storage.data.level + 1} zu erreichen.`.replace('fehlen noch 1 Erfahrungspunkte', 'fehlt noch ein Erfahrungspunkt').replace(' 1 Erfahrungspunkte', ' einen Erfahrungspunkt'))
            await ita.reply({ embeds: [embed], ephemeral: true})
        }
    }
}

export default options