import Discord from 'discord.js'
import getcolor from '../subcommands/getcolor'
import emotes from '../emotes.json'
import embeds from '../embeds'
import { getData, update } from '../db'

export default {
    name: 'KeksBox',
    event: 'messageCreate',
    async on(msg: Discord.Message, client: Discord.Client) {
        if(!msg.guild || msg.author.bot || msg.author.system) return
        var serverdata = await getData('serverdata', msg.guild.id)
        var spawnrate = 100
        if(serverdata?.keksbox) {
            spawnrate = serverdata.keksbox.spawnrate || 100
            if(serverdata.keksbox.channels?.length && !serverdata.keksbox.channels.includes(msg.channel.id)) return
        }
        if(!Math.floor(Math.random() * spawnrate)) {
            if(!serverdata) serverdata = update('serverdata', msg.guild.id, {})
            const color = await getcolor(msg.guild)
            var keksbox = serverdata.keksbox || {}
            if(keksbox.message) return
            let embed
            switch(Math.floor(Math.random() * 50)) {
                case 0:
                case 1:
                    embed = new Discord.EmbedBuilder()
                        .setColor(color.lime)
                        .setTitle(':deciduous_tree: Bio Kekse')
                        .setDescription('Eine ganz besondere Packung mit ökologischen Keksen ist aufgetaucht.')
                        .setFooter({ text: 'Drücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.' })
                    keksbox.multiplier = 2
                    break
                case 2: 
                    embed = new Discord.EmbedBuilder()
                        .setColor(color.yellow)
                        .setTitle('<:cookie3:844554845499293723> Kekslieferung')
                        .setFooter({ text: 'Drücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.' })
                        .setDescription('Eine Kekslieferung ist gerade eingetroffen. Vielleicht wurde beim Verpacken der Kekse aber ein zu großer Karton gewählt, jetzt sind es deutlich mehr.\nDrücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.')
                    keksbox.multiplier = 5
                    break
                default: 
                    switch(Math.floor(Math.random() * 3)) {
                        case 0:
                            embed = new Discord.EmbedBuilder()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Kekseeeeee`)
                                .setFooter({ text: 'Drücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.' })
                                .setDescription('Eine Kekslieferung ist gerade gekommen.')
                            break
                        case 1:
                            embed = new Discord.EmbedBuilder()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Die Lieferung ist da`)
                                .setFooter({ text: 'Drücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.' })
                                .setDescription('Ein Paket voller Kekse ist aufgetaucht.')
                            break
                        default: 
                            embed = new Discord.EmbedBuilder()
                                .setColor(color.normal)
                                .setTitle(`${emotes.cookie} Huch`)
                                .setFooter({ text: 'Drücke hier unten auf den Knopf, oder verwende `/claim`, um das Paket einzusammeln.' })
                                .setDescription('Ein Haufen Kekse erscheint.')
                    }
                    keksbox.multiplier = 1
            }
            let button = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .setComponents(
                    new Discord.ButtonBuilder()
                        .setStyle(Discord.ButtonStyle.Primary)
                        .setLabel('Einsammeln')
                        .setCustomId('keksbox:claim')
                )
            let message = await msg.channel.send({ embeds: [embed], components: [button]})
            keksbox.message = message.id
            await update('serverdata', msg.guild.id, { keksbox })
            const filter = (ita: any) => ita.customId === 'keksbox:claim'
            const collector = message.createMessageComponentCollector({ filter, max: 1, componentType: Discord.ComponentType.Button })
            //@ts-ignore
            collector.on('collect', async function(ita) {
                serverdata = await ita.guild.getData()
                var content = Math.random() * 10
                if(!serverdata.keksbox?.message || (!message.deletable && !message.editable)) return embeds.errorMessage(message, 'Fehler', 'Bei der Verarbeitung der KeksBox ist ein Fehler aufgetreten.', true, false)
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
                keksbox.message = null
                keksbox.multiplier = null
                await ita.guild.setData({ keksbox })
                await require('../db/update')('userdata', ita.user.id, { cookies: userdata.cookies })
            })
        }
    }
}