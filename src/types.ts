import discord = require('discord.js')

declare module 'discord.js' {
    interface Collection<K, V> {
        array(): V[]
    }

    interface CommandInteraction<Cached extends discord.CacheType = discord.CacheType> {
        safeReply(messageOptions: MessageOptions): Promise<CommandInteraction>
    }

    interface ButtonInteraction<Cached extends discord.CacheType = discord.CacheType> {
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
}