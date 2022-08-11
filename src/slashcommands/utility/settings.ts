import Discord from 'discord.js'
import * as settings from './settings/index'

const options: CommandOptions = {
    name: 'settings',
    description: 'Ändert die KeksBot Einstellungen',
    defaultMemberPermissions: 'ManageGuild',
    options: [
        { //keksbox
            name: 'keksbox',
            type: Discord.ApplicationCommandOptionType.Subcommand,
            description: 'Ändert KeksBox Einstellungen',
            options: [
                {
                    name: 'delete-message',
                    type: Discord.ApplicationCommandOptionType.String,
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
                    type: 4,
                    description: 'Durchschnittliche Nachrichtenanzahl zwischen KeksBoxen'
                }
            ]
        },
        { //theme
            name: 'theme',
            type: 1,
            description: 'Farbeinstellungen für Embeds',
            options: [
                {
                    name: 'color',
                    description: 'Farbe für normale Embeds',
                    type: 3
                },
                {
                    name: 'theme',
                    description: 'Farbschema für andere Embeds',
                    type: 3,
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
        }
    ],
    async execute(ita, args, client) {
        if(args.subcommand == 'keksbox') settings.keksbox(ita, args)
        else if(args.subcommand == 'theme') settings.theme(ita, args, client)
    }
}

export default options