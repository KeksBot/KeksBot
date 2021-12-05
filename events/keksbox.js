const discord = require('discord.js')
const getcolor = require('../subcommands/getcolor')
const emotes = require('../emotes.json')
const embeds = require('../embeds')

module.exports = {
    name: 'KeksBox',
    event: 'messageCreate',
    async on(msg, client) {
        if(!msg.guild || msg.author.bot || msg.author.system) return
        var serverdata = await require('../db/getData')('serverdata', msg.guild.id)
        var spawnrate = 100
        if(serverdata?.keksbox) {
            spawnrate = serverdata.keksbox.spawnrate || 100
            if(serverdata.keksbox.channels?.length && !serverdata.keksbox.channels.includes(msg.channel.id)) return
        }
        if(!Math.floor(Math.random() * spawnrate)) {
            if(!serverdata) serverdata = await require('../db/create')('serverdata', msg.guild.id)
            const color = await getcolor(msg.guild, serverdata)
            var keksbox = serverdata.keksbox || {}
            if(keksbox.message) return
            switch(Math.floor(Math.random() * 50)) {
                case 0:
                case 1:
                    var embed = new discord.MessageEmbed()
                        .setColor(color.lime)
                        .setTitle(':deciduous_tree: Bio Kekse')
                        .setDescription('Eine ganz besondere Packung mit ökologischen Keksen ist aufgetaucht.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.')
                    keksbox.multiplier = 2
                    break
                case 2: 
                    var embed = new discord.MessageEmbed()
                        .setColor(color.yellow)
                        .setTitle('<:cookie3:844554845499293723> Kekslieferung')
                        .setDescription('Eine Kekslieferung ist gerade eingetroffen. Vielleicht wurde beim Verpacken der Kekse aber ein zu großer Karton gewählt, jetzt sind es deutlich mehr.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.')
                    keksbox.multiplier = 5
                    break
                default: 
                    switch(Math.floor(Math.random() * 3)) {
                        case 0:
                            var embed = new discord.MessageEmbed()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Kekseeeeee`)
                                .setDescription('Eine Kekslieferung ist gerade gekommen.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.')
                            break
                        case 1:
                            var embed = new discord.MessageEmbed()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Die Lieferung ist da`)
                                .setDescription('Ein Paket voller Kekse ist aufgetaucht.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.')
                            break
                        default: 
                            var embed = new discord.MessageEmbed()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Huch`)
                                .setDescription('Ein Haufen Kekse erscheint.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um sie einzusammeln.')
                    }
                    keksbox.multiplier = 1
            }
            let button = new discord.MessageActionRow()
                .addComponents(
                    new discord.MessageButton()
                        .setStyle('PRIMARY')
                        .setLabel('Einsammeln')
                        .setCustomId('keksbox:claim')
                )
            /** @type {discord.Message}*/
            var message = await msg.channel.send({ embeds: [embed], components: [button]})
            keksbox.message = message.id
            await require('../db/update')('serverdata', msg.guild.id, { keksbox })
            const filter = ita => ita.customId === 'keksbox:claim'
            const collector = message.createMessageComponentCollector({ filter, max: 1, componentType: 'BUTTON' })
            collector.on('collect', async function(ita) {
                serverdata = await require('../db/getData')('serverdata', ita.guild.id)
                var content = Math.random() * 10
                if(!serverdata.keksbox?.message || message.deleted) return embeds.errorMessage(message, 'Fehler', 'Bei der Verarbeitung der KeksBox ist ein Fehler aufgetreten.', true, false)
                if(serverdata.keksbox.spawnrate) content *= serverdata.keksbox.spawnrate
                else {
                    content *= 100
                    serverdata.keksbox.spawnrate = 100
                }
                content = Math.round(content * serverdata.keksbox.multiplier)
                embeds.successMessage(message, 'Paket eingesammelt', `<@!${ita.user.id}> hat das Paket eingesammelt und ${content} Kekse erhalten.`, true, serverdata.keksbox.keepmessage)
                var userdata = await require('../db/getData')('userdata', ita.user.id)
                if(!userdata) userdata = await require('../db/create')('userdata', ita.user.id)
                if(!userdata.cookies) userdata.cookies = 0
                userdata.cookies += content
                let { keksbox } = serverdata
                await require('../db/update')('serverdata', ita.guild.id, { keksbox: { channels: keksbox.channels, spawnrate: keksbox.spawnrate } })
                await require('../db/update')('userdata', ita.user.id, { cookies: userdata.cookies })
            })
        }
    }
}