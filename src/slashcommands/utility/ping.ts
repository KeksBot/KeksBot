import discord from 'discord.js'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'ping',
    description: 'Zeigt die Latenz vom Bot an',
    global: true,
    async execute(ita, args, client) {
        const { color } = ita
        var discordping = client.ws.ping
        // var dbping = Date.now()
        // try { await (await connect()).connection.db.admin().ping() } catch (error) { ita.error('Fehler', 'Die Datenbank ist aktuell nicht erreichbar.', true) }
        // dbping = Date.now() - dbping
        let embed = new discord.EmbedBuilder()
            .setTitle(emotes.pinging + ' Pong')
            .setDescription(`:hourglass: API Ping: ${discordping} ms`)//\n:pencil: Datenbank Ping: ${dbping} ms`)
        let highest = discordping // > dbping ? discordping : dbping
        embed.setColor(
            highest < 90 ? color.normal :
            highest < 150 ? color.lime :
            highest < 300 ? color.yellow :
            color.red
        )
        return ita.reply({ embeds: [embed], ephemeral: true })
    }
}

export default options