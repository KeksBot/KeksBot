import Discord = require('Discord.js')

declare module 'Discord.js' {
    interface Collection<K, V> {
        array(): V[]
    }

    interface CommandInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        safeReply(messageOptions: MessageOptions): Promise<CommandInteraction>
    }

    interface ButtonInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        safeUpdate(messageOptions: MessageOptions): Promise<CommandInteraction>
    }

    interface Client<Ready extends boolean = boolean> {
        battles: Collection<string | number, any>
    }

    interface User {
        data: Userdata
        setData(data: Userdata): Promise<Userdata>
        save(): Promise<Userdata>
    }

    interface Guild {

    }
}

declare global {
    interface String {
        replaceLast(searchValue: string, replaceValue: string): string
    }

    interface Userdata {
        _id: string,
        xp: number,
        level: number,
        cookies: number,
        giftdm: number,
        thismin: number,
        badges: {
            partner: number,
            verified: boolean,
            team: boolean,
            dev: boolean,
            mod: boolean,
            beta: boolean
        },
        banned: {
            time: number,
            reason: string
        },
        battle: {
            skills: [
                {
                    name: string,
                    value: number
                }
            ],
            ready: boolean,
            priority: string,
            currentHP: number,
            healTimestamp: number,
            inventory: [{
                id: string,
                count: number,
            }],
            attacks: [string],
        },
        tan: string
    }

    interface BattleUser {
        user: Discord.User
        member: Discord.GuildMember
        interaction: Discord.ButtonInteraction
        battle: Userdata['battle']
        id: string
        team: number
        skills: Userdata['battle']['skills']
        attacks: [{ id: string, uses: number }]
        ai: boolean
    }

    // interface EmbedRenderer {

    // }

    interface BaseBattle {
        users: Discord.Collection<string, BattleUser>
        private: boolean
        message: Discord.Message
        id: number
        color: Color
        client: Discord.Client
    }

    interface Color {
        red: Discord.ColorResolvable,
        yellow: Discord.ColorResolvable,
        lime: Discord.ColorResolvable,
        normal: Discord.ColorResolvable
    }
}