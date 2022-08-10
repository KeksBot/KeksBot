const discord = require('discord.js')
const embeds = require('../../embeds')
const update = require('../../db/update')
const delay = require('delay')

module.exports = {
    name: 'claim',
    description: 'Sammle eine KeksBox auf',
    battlelock: true,
    async execute(interaction, args, client) {
        var { guild, user } = interaction
        if(!guild.data.keksbox?.message) return embeds.error(interaction, 'Fehler', 'Es gibt gerade kein Paket, das abgeholt werden kann.', true)
        var content = Math.random() * 10
        if(guild.data.keksbox.spawnrate) content *= guild.data.keksbox.spawnrate
        else {
            content *= 100
            serverdata.keksbox.spawnrate = 100
        }
        content = Math.round(content * serverdata.keksbox.multiplier)
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
                    embeds.successMessage(message, 'Paket eingesammelt', `<@!${user.id}> hat das Paket eingesammelt und ${content} Kekse erhalten.`, true, guild.data.keksbox.keepmessage)
                    embeds.success(interaction, 'Paket eingesammelt', `Du hast das Paket eingesammelt und ${content} Kekse erhalten.`, true)
                    if(!user.data.cookies) user.daPaketta.cookies = 0
                    user.data.cookies += content
                    let { keksbox } = guild.data
                    keksbox.message = null
                    keksbox.multiplier = null
                    if(keksbox.message) await require('../../db/update')('serverdata', guild.id, { keksbox })
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
        keksbox.message = null
        keksbox.multiplier = null
        if(keksbox.message) await require('../../db/update')('serverdata', guild.id, { keksbox })
        return embeds.error(interaction, 'Fehler', 'Ein unbekannter Fehler ist aufgetreten. Die Kekse konnten nicht zugestellt werden.', true)
    }
}