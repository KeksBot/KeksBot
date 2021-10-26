const discord = require('discord.js')
const embeds = require('../../embeds')
const update = require('../../db/update')
const delay = require('delay')

module.exports = {
    name: 'claim',
    description: 'Sammle eine KeksBox auf',
    async execute(interaction, args, client) {
        var { guild, user } = interaction
        if(!guild.data.keksbox || !guild.data.keksbox.message) return embeds.error(interaction, 'Fehler', 'Es gibt gerade kein Paket, das abgeholt werden kann.', true)
        var content = Math.floor(Math.random() * 10 + 1)
        if(guild.data.keksbox.spawnrate) content *= guild.data.keksbox.spawnrate
        content *= guild.data.keksbox.multiplier
        var foundOne = false
        await guild.channels.fetch()
        var channels = guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').array()
        var waiting = true
        var size = 0
        channels.forEach(async channel => {
            try {
                var message
                try {message = await channel.messages.fetch(guild.data.keksbox.message)} catch {}
                if(message && !message.deleted) {
                    foundOne = true
                    embeds.successMessage(message, 'Paket eingesammelt', `<@!${user.id}> hat das Paket eingesammelt und ${content} Kekse erhalten.`, true, false)
                    embeds.success(interaction, 'Paket eingesammelt', `Du hast das Paket eingesammelt und ${content} Kekse erhalten.`, true)
                    if(!user.data.cookies) user.data.cookies = 0
                    user.data.cookies += content
                    let { keksbox } = guild.data
                    await require('../../db/update')('serverdata', guild.id, { keksbox: { channels: keksbox.channels, spawnrate: keksbox.spawnrate } })
                    await require('../../db/update')('userdata', user.id, { cookies: user.data.cookies })
                    return
                }
            } catch (error) {
                console.error(error)
            }
            size ++
            if(size >= channels.length) waiting = false
        })
        while(waiting) {await delay(50)}
        let { keksbox } = guild.data
        if(keksbox.message) await require('../../db/update')('serverdata', guild.id, { keksbox: { channels: keksbox.channels, spawnrate: keksbox.spawnrate } })
        return embeds.error(interaction, 'Fehler', 'Ein unbekannter Fehler ist aufgetreten. Die Kekse konnten nicht zugestellt werden.', true)
    }
}