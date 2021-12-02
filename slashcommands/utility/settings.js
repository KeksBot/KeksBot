const discord = require('discord.js')
const { isInteger } = require('mathjs')
const update = require('../../db/update')
const embeds = require('../../embeds')

module.exports = {
    name: 'settings',
    description: 'Ändert die KeksBot Einstellungen',
    options: [
        {
            name: 'keksbox',
            type: 'SUB_COMMAND',
            description: 'Ändert KeksBox Einstellungen',
            options: [
                {
                    name: 'delete-message',
                    type: 'STRING',
                    description: 'Ändert, ob die KeksBox Nachricht nach dem Einsammeln gelöscht wird',
                    choices: [
                        {
                            name: 'Ja',
                            value: 'Ja'
                        },
                        {
                            name: 'Nein',
                            value: 'Nein'
                        }
                    ]
                },
                {
                    name: 'spawnrate',
                    type: 'INTEGER',
                    description: 'Durchschnittliche Nachrichtenanzahl zwischen KeksBoxen'
                }
            ]
        }
    ],
    permission: 'MANAGE_GUILD',
    async execute(ita, args, client) {
        var { guild, user, color } = ita
        if(args.subcommand == 'keksbox') {
            var informationtext = []
            var error = false
            if(!guild.data.keksbox) guild.data.keksbox = {}
            if(args.delete_message) {
                if(args.delete_message == 'Nein') {
                    guild.data.keksbox.keepmessage = true
                    informationtext.push('KeksBox Nachrichten werden nicht mehr gelöscht.')
                } else {
                    guild.data.keksbox.keepmessage = false
                    informationtext.push('KeksBox Nachrichten werden nach dem Einsammeln gelöscht.')
                }
            } 
            if(args.spawnrate) {
                if(20 <= args.spawnrate && args.spawnrate <= 10000) {
                    guild.data.keksbox.spawnrate = args.spawnrate
                    informationtext.push(`KeksBoxen spawnen nun durchschnittlich alle ${args.spawnrate} Nachrichten (${(Math.round(1 / args.spawnrate * 10000) / 100).toString().replace('.', ',')}%)`)
                } else {
                    error = true
                    informationtext = ['Es wurden keine Einstellungen übernommen', 'Spawnrate: Bitte gib eine Zahl zwischen 20 und 10000 an']
                }
            }
            if(informationtext.length) {
                if(error) return embeds.error(ita, 'Syntaxfehler', informationtext.join('\n'), true)
                await update('serverdata', guild.id, { keksbox: guild.data.keksbox })
                return embeds.success(ita, 'Änderungen übernommen', informationtext.join('\n'), true)
            }
            let embed = new discord.MessageEmbed()
                .setColor(color.normal)
                .setTitle('⚙️ KeksBox Einstellungen')
                .addField('Nachricht löschen', '`/settings keksbox delete_message`\nBei "Nein" wird die Nachricht von KeksBoxen nach dem Einsammeln nicht gelöscht.\nStandardwert: "Ja"', true)
                .addField('Spawnrate ändern', '`/settings keksbox spawnrate`\n\
Durchschnittliche Anzahl der Nachrichten zwischen zwei KeksBoxen.\nDer Inhalt des Pakets hängt von der Spawnrate ab, häufigere Pakete führen zu weniger Inhalt, sodass die im Schnitt erhaltene Menge pro Nachricht immer gleich bleibt.\n\
Angegebener Wert muss zwischen 20 und 10000 liegen (inklusiv).\nStandardwert: 100', true)
                .addField('Kanäle ändern', '`[WIP]`\nDiese Funktion ist aktuell noch nicht implementiert.\nIn vorherigen Versionen festgelegte Spawn-Kanäle bleiben vorerst aktiv.', true)
                .setDescription(`Aktuelle Einstellungen:\n Nachrichten löschen: ${guild.data.keksbox?.keepmessage?.toString().replace('true', 'Nein').replace('false', 'Ja') || 'Ja'}\n` + 
` Spawnrate: 1 pro ${guild.data.keksbox?.spawnrate || 100} Nachrichten`)
            return ita.reply({ embeds: [embed], ephemeral: true })
        }
    }
}