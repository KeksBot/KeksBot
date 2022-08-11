import Discord from 'discord.js'
import embeds from '../../embeds'
import update from '../../db/update'
import delay from 'delay'

const options: CommandOptions = {
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
            guild.data.keksbox.spawnrate = 100
        }
        content = Math.round(content * guild.data.keksbox.multiplier)
        let channel = await guild.channels.fetch(guild.data.keksbox.channel)
        if(!channel?.isTextBased()) {
            let { keksbox } = guild.data
            keksbox.message = null
            keksbox.multiplier = null
            keksbox.channel = null
            await guild.setData({ keksbox })
            return embeds.error(interaction, 'Fehler', 'Es gibt gerade kein Paket, das abgeholt werden kann.', true)
        }
        try {
            var message
            try {message = await channel.messages.fetch(guild.data.keksbox.message)} catch {
                let { keksbox } = guild.data
                keksbox.message = null
                keksbox.multiplier = null
                keksbox.channel = null
                await guild.setData({ keksbox })
                return embeds.error(interaction, 'Fehler', 'Es gibt gerade kein Paket, das abgeholt werden kann.', true)
            }
            if(message && (message.deletable || message.editable)) {
                embeds.successMessage(message, 'Paket eingesammelt', `<@!${user.id}> hat das Paket eingesammelt und ${content} Kekse erhalten.`, true, guild.data.keksbox.keepmessage)
                embeds.success(interaction, 'Paket eingesammelt', `Du hast das Paket eingesammelt und ${content} Kekse erhalten.`, true)
                if(!user.data.cookies) user.data.cookies = 0
                user.data.cookies += content
                let { keksbox } = guild.data
                keksbox.message = null
                keksbox.multiplier = null
                keksbox.channel = null
                await guild.setData({ keksbox })
                await user.save()
                return
            }
            let { keksbox } = guild.data
            keksbox.message = null
            keksbox.multiplier = null
            keksbox.channel = null
            await guild.setData({ keksbox })
            return embeds.error(interaction, 'Fehler', 'Es gibt gerade kein Paket, das abgeholt werden kann.', true)
        } catch (error) {
            console.error(error)
        }
        let { keksbox } = guild.data
        keksbox.message = null
        keksbox.multiplier = null
        keksbox.channel = null
        if(keksbox.message) await guild.setData({ keksbox })
        return embeds.error(interaction, 'Fehler', 'Ein unbekannter Fehler ist aufgetreten. Die Kekse konnten nicht zugestellt werden.', true)
    }
}

export default options