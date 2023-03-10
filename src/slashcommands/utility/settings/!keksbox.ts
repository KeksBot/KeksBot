import Discord, { ModalBuilder } from 'discord.js'
import embeds from '../../../embeds'
import handleError from '../../../subcommands/handleError'

export default async function (ita: Discord.CommandInteraction, args: any) {
    let { guild, color } = ita
    let informationtext = []
    let error = false
    if (!guild.storage.data.keksbox) guild.storage.data.keksbox = { id: guild.id }
    if (args.delete_message) {
        if (args.delete_message == 'Nein') {
            guild.storage.data.keksbox.keepmessage = true
            informationtext.push('KeksBox Nachrichten werden nicht mehr gelöscht.')
        } else {
            guild.storage.data.keksbox.keepmessage = false
            informationtext.push('KeksBox Nachrichten werden nach dem Einsammeln gelöscht.')
        }
    }
    if (args.spawnrate) {
        if (20 <= args.spawnrate && args.spawnrate <= 10000) {
            guild.storage.data.keksbox.spawnrate = args.spawnrate
            informationtext.push(`KeksBoxen spawnen nun durchschnittlich alle ${args.spawnrate} Nachrichten (${(Math.round(1 / args.spawnrate * 10000) / 100).toString().replace('.', ',')}%)`)
        } else {
            error = true
            informationtext = ['Es wurden keine Einstellungen übernommen', 'Spawnrate: Bitte gib eine Zahl zwischen 20 und 10000 an']
        }
    }
    if (informationtext.length) {
        if (error) return embeds.error(ita, 'Syntaxfehler', informationtext.join('\n'), true)
        await guild.setData({ keksbox: guild.storage.data.keksbox })
        return embeds.success(ita, 'Änderungen übernommen', informationtext.join('\n'), true)
    }
    let embed = new Discord.EmbedBuilder()
        .setColor(color.normal)
        .setTitle('⚙️ KeksBox Einstellungen')
        .addFields([
            {
                name: 'Nachricht löschen',
                value: '`/settings keksbox delete-message`\nBei "Nein" wird die Nachricht von KeksBoxen nach dem Einsammeln nicht gelöscht.\nStandardwert: "Ja"',
                inline: true
            }, {
                name: 'Spawnrate ändern',
                value: '`/settings keksbox spawnrate`\n' +
                    'Durchschnittliche Anzahl der Nachrichten zwischen zwei KeksBoxen.\nDer Inhalt des Pakets hängt von der Spawnrate ab, häufigere Pakete führen zu weniger Inhalt, sodass die im Schnitt erhaltene Menge pro Nachricht immer gleich bleibt.\n' +
                    'Angegebener Wert muss zwischen 20 und 10000 liegen (inklusiv).\nStandardwert: 100',
                inline: true
            }, {
                name: 'KeksBox Kanäle',
                value: '`[Kanaleinstellungen]`\n' +
                    'Kanäle festlegen, in denen KeksBoxen auftauchen können.\nID oder Namen (nur bei einzigartigen Kanälen) aller Spawnchannel durch ein Komma oder neue Zeilen getrennt eingeben. "0" als einzige Eingabe deaktivert KeksBoxen vollständig\n' +
                    'Beispiel: ```allgemein, #kekskanal\n775001585541185550```',
                inline: true
            }])
        .setDescription(`Aktuelle Einstellungen:\n Nachrichten löschen: ${guild.storage.data.keksbox?.keepmessage?.toString().replace('true', 'Nein').replace('false', 'Ja') || 'Ja'}\n` +
            ` Spawnrate: 1 pro ${guild.storage.data.keksbox?.spawnrate || 100} Nachrichten`)
    let components = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
        .addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('settings.keksbox:change-channel-whitelist')
                .setLabel('Kanaleinstellungen')
                .setStyle(Discord.ButtonStyle.Secondary)
        )
    let message = await ita.reply({ embeds: [embed], components: [components], ephemeral: true, fetchReply: true })
    const collector = message.createMessageComponentCollector({ time: 900000, componentType: Discord.ComponentType.Button })

    collector.on('collect', async ita => {
        try {
            if (ita.customId == 'settings.keksbox:change-channel-whitelist') {
                await guild.channels.fetch()
                let value: string = ''
                if (!guild.storage.data.keksbox) guild.storage.data.keksbox = { id: guild.id }
                if (!guild.storage.data.keksbox.channels) guild.storage.data.keksbox.channels = []
                if (guild.storage.data.keksbox.channels.length == 1 && guild.storage.data.keksbox.channels[0] == '0') value = '0'
                else {
                    value = guild.storage.data.keksbox.channels.map(c => {
                        return '#' + (guild.channels.cache.filter(c => c.isTextBased()).get(c)?.name || -1) + ' | ' + c
                    }).filter(t => !t.startsWith('#-1')).join('\n')
                }

                await ita.showModal(
                    new ModalBuilder()
                        .setTitle('KeksBox Einstellungen')
                        .setCustomId('settings.keksbox:channel-whitelist-modal')
                        .addComponents(
                            new Discord.ActionRowBuilder<Discord.TextInputBuilder>()
                                .addComponents(
                                    new Discord.TextInputBuilder()
                                        .setCustomId('settings.keksbox:set-channel-whitelist')
                                        .setLabel('KeksBox Spawnkanäle')
                                        .setStyle(Discord.TextInputStyle.Paragraph)
                                        .setRequired(true)
                                        .setValue(value)
                                )

                        )
                )

                let interaction = await ita.awaitModalSubmit({ time: 900000, filter: ita => ita.customId == 'settings.keksbox:channel-whitelist-modal' }).catch(() => { })
                if (!interaction) return
                await guild.channels.fetch()
                value = interaction.fields.getTextInputValue('settings.keksbox:set-channel-whitelist')
                if (value.trim() == '0') {
                    guild.storage.data.keksbox.channels = ['0']
                    await guild.save()
                    embed.setFooter({ text: 'KeksBoxen deaktiviert' })
                    //@ts-ignore
                    return interaction.update({ embeds: [embed] })
                }
                let textchannels = guild.channels.cache.filter(c => c.isTextBased())
                let values = value.replaceAll('\n', ',')
                    .replaceAll('|', ',')
                    .replaceAll('#', '')
                    .split(',')
                    .map(v => v.trim())
                    .filter(v => v != '')
                    .map(v => {
                        return textchannels.has(v) ? v :
                            textchannels.findKey(channel => channel.name === v) || null
                    })
                    .filter(v => v)
                values = [...(new Set(values))]
                guild.storage.data.keksbox.channels = values
                await guild.save()
                //@ts-ignore
                return interaction.update({ embeds: [embed.setFooter({ text: 'Änderungen übernommen' })] })
            }
        } catch (e) {
            await handleError(ita, e)
        }
    })
}