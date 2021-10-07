const discord = require('discord.js')

module.exports = {
    name: 'ping',
    description: 'Zeigt die Latenz vom Bot an.',
    async execute(ita, args, client) {
        const { color } = ita
        var discordping = client.ws.ping
        let db = await require('../../db/database')
        var dbping = Date.now()
        try { await (await db()).connection.db.admin().ping() } catch (error) {return require('../../embeds').error(ita, 'Fehler', 'Die Datenbank ist aktuell nicht erreichbar.', true)}
        dbping = Date.now() - dbping
        let embed = new discord.MessageEmbed()
            .setTitle('<:keksping:786306024458027100> Pong')
            .setDescription(`:hourglass: API Ping: ${discordping} ms\n:pencil: Datenbank Ping: ${dbping} ms`)
        let highest = discordping
        if(discordping < dbping) highest = dbping
        if(highest < 90) embed.setColor(color.normal)
        else if(highest < 150) embed.setColor(color.lime)
        else if(highest < 300) embed.setColor(color.yellow)
        else embed.setColor(color.red)
        return ita.reply({ embeds: [embed], ephemeral: true })
    }
}