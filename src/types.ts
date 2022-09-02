import Discord = require('discord.js')
const { default: EmbedRenderer } = require('./battledata/EmbedRenderer')

declare module 'discord.js' {
    interface Collection<K, V> {
        array(): V[]
    }

    interface CommandInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        safeReply(messageOptions: Discord.InteractionReplyOptions): Promise<Message<boolean> | InteractionResponse<boolean>>
    }

    interface ButtonInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        safeUpdate(messageOptions: Discord.InteractionUpdateOptions): Promise<Message<boolean> | InteractionResponse<boolean>>
    }

    interface SelectMenuInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        safeUpdate(messageOptions: Discord.InteractionUpdateOptions): Promise<Message<boolean> | InteractionResponse<boolean>>
    }

    interface BaseInteraction<Cached extends Discord.CacheType = Discord.CacheType> {
        color?: Color
        success(title: string, description: string, ephemeral?: boolean, del?: boolean): this
        error(title: string, description: string, ephemeral?: boolean, del?: boolean): this
    }

    interface Client<Ready extends boolean = boolean> {
        battles: Collection<string | number, any>
        commands: Collection<string, CommandOptions>
        cooldowns: Collection<string, any>
        thismin: Collection<string, number>
    }

    interface User {
        data: UserData
        setData(data: any): Promise<UserData>
        getData(): Promise<UserData>
        save(): Promise<UserData>
    }

    interface Guild {
        data: GuildData
        setData(data: any): Promise<GuildData>
        getData(): Promise<GuildData>
        save(): Promise<GuildData>
    }

    interface GuildMember {
        data?: UserData
    }
}

declare global {
    interface String {
        replaceLast(searchValue: string, replaceValue: string): string
    }

    interface UserData {
        _id: string,
        xp?: number,
        level?: number,
        cookies?: number,
        giftdm?: number,
        badges?: {
            partner?: number,
            verified?: boolean,
            team?: boolean,
            dev?: boolean,
            mod?: boolean,
            beta?: boolean,
            vip?: boolean
        },
        banned?: {
            time?: number,
            reason?: string
        },
        battle?: {
            skills?: [
                {
                    name: string,
                    value: number
                }?
            ],
            ready?: boolean,
            priority?: string,
            currentHP?: number,
            healTimestamp?: number,
            inventory?: [{
                id: string,
                count: number,
            }?],
            attacks?: [number],
        }
    }

    interface BattleUser {
        user: Discord.User
        member: Discord.GuildMember
        interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction
        battle: UserData['battle']
        id: string
        team: number
        skills: {
            name: string
            value: number
            getValue?: () => number
        }[]
        attacks: { id: string, uses: number }[]
        color: Color
        name: string
        move?: {
            targets?: string[],
            action: number,
            user: BattleUser
        }
        skillChanges?: UserData['battle']['skills']
    }

    interface BaseBattle {
        users: Discord.Collection<string, BattleUser>
        private: boolean
        message: Discord.Message
        id: number
        color: Color
        client: Discord.Client
        started: boolean
    }

    interface Color {
        red: Discord.ColorResolvable,
        yellow: Discord.ColorResolvable,
        lime: Discord.ColorResolvable,
        normal: Discord.ColorResolvable// | 'role'
    }

    interface GuildData {
        _id: string
        xp?: number,
        level?: number,
        partner?: number, /*
            2: Antrag gestellt
            1: Partner
            0: Kein Partner/Antrag
            -1: Kein Partner/blockiert
        */
        verified?: Boolean,
        theme?: Color
        keksbox?: {
            spawnrate?: number, //Durchschnittliche Anzahl zw. KeksBoxen
            channels?: Array<Discord.Snowflake>, //Channel Whitelist
            message?: Discord.MessageResolvable, //Nachricht vom Paket
            multiplier?: number, //Für besondere KeksBoxen
            keepmessage?: boolean, //Ob die Nachricht beim claimen gelöscht werden soll
            channel?: Discord.Snowflake, //Channel für die Nachricht
        }
    }

    type CommandOptions = Discord.ApplicationCommandData & {
        cooldown?: number
        battlelock?: boolean
        before?: any
        global?: boolean
        execute(interaction: Discord.CommandInteraction, args: any, client: Discord.Client): any
    }

    interface BattleAction {
        name: string
        type: string
        description: string
        uses?: number
        strength?: number
        priority: number
        targets?: number
        accuracy?: number
        onUse?(battle: BaseBattle, user: BattleUser, targets: BattleUser[]): Promise<string | void> | string | void
        aHeal?: {
            onTarget?: boolean
            value: number
        } | number
        rHeal?: {
            onTarget?: boolean
            value: number
        } | number
        modifiedSkills?: {
            name: string
            value: number
            onTarget?: boolean
            probability?: number
        }[]
    }
}