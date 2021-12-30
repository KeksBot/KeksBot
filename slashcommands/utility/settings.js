const discord = require('discord.js')
const update = require('../../db/update')
const embeds = require('../../embeds')
const settings = require('./settings/!all')

module.exports = {
    name: 'settings',
    description: 'Ändert die KeksBot Einstellungen',
    options: [
        { //keksbox
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
        },
        { //theme
            name: 'theme',
            type: 'SUB_COMMAND',
            description: 'Farbeinstellungen für Embeds',
            options: [
                {
                    name: 'color',
                    description: 'Farbe für normale Embeds',
                    type: 'STRING'
                },
                {
                    name: 'theme',
                    description: 'Farbschema für andere Embeds',
                    type: 'STRING',
                    choices: [
                        {
                            name: 'KeksBot Standard',
                            value: 'default'
                        },
                        {
                            name: 'KeksBot Dark',
                            value: 'dark'
                        },
                        {
                            name: 'KeksBot Origins',
                            value: 'old'
                        },
                        {
                            name: 'Discord Farben',
                            value: 'discord'
                        },
                        {
                            name: 'Graustufen',
                            value: 'gray'
                        },

                    ]
                }
            ]
        },
        { //moderation
            name: 'moderation',
            type: 'SUB_COMMAND',
            description: 'Erweiterte Moderationseinstellungen',
            options: [
                {
                    name: 'instant-modactions',
                    description: 'Ändert, ob Moderationen sofort ausgeführt werden (Toggle Switch)',
                    type: 'STRING',
                    choices: [
                        {
                            name: 'ban',
                            value: 'ban'
                        },
                        {
                            name: 'kick',
                            value: 'kick'
                        },
                        {
                            name: 'timeout',
                            value: 'timeout'
                        },
                        {
                            name: 'warn',
                            value: 'warn'
                        },
                        {
                            name: 'Alle überspringen',
                            value: 'skip-all'
                        },
                        {
                            name: 'Alle überprüfen',
                            value: 'check-all'
                        }
                    ]
                }
            ]
        }
    ],
    permission: 'MANAGE_GUILD',
    async execute(ita, args, client) {
        if(args.subcommand == 'keksbox') settings.keksbox(ita, args)
        else if(args.subcommand == 'theme') settings.theme(ita, args, client)
        else if(args.subcommand == 'moderation') settings.moderation(ita, args)
    }
}