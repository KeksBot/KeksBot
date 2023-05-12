import Discord = require('discord.js')
import { UserDataManager, GuildDataManager } from './db'

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
        success(title: string, description: string, ephemeral?: boolean, del?: boolean): Promise<this>
        error(title: string, description: string, ephemeral?: boolean, del?: boolean): Promise<this>
    }

    interface Client<Ready extends boolean = boolean> {
        battles: Collection<string | number, any>
        commands: Collection<string, CommandOptions>
        cooldowns: Collection<string, any>
        thismin: Collection<string, number>
    }

    interface User {
        storage: UserDataManager
        setData(data: any): Promise<UserData>
        getData(): Promise<UserData>
        save(): Promise<UserData>
        create(): Promise<UserData>
        load(): Promise<UserData>
    }

    interface Guild {
        storage: GuildDataManager
        setData(data: any): Promise<GuildData>
        getData(): Promise<GuildData>
        save(): Promise<GuildData>
        create(): Promise<GuildData>
        load(): Promise<GuildData>
    }

    interface GuildMember {
        data?: UserData
    }

    // interface StageChannel {
    //     send(arg0: any): Promise<Message>
    // }
}

declare global {
    type languages = 'de'

    type Stats = 'hp' | 'attack' | 'defense' | 'speed' | 'accuracy' | 'critRate' | 'critDamage' | 'regeneration' | 'mana' | 'mAttack' | 'mDefense'

    type StatOptions = {
        base: number,
        priority: number,
        increment: number,
        relModifier: number,
        absModifier: number,
        randomness: number,
    }

    interface String {
        replaceLast(searchValue: string, replaceValue: string): string
        title(): string
    }

    interface GuildData {
        __modules?: DbSchemas
        id: string
        xp: number
        level: number
        partner: number /*
            2: Antrag gestellt
            1: Partner
            0: Kein Partner/Antrag
            -1: Kein Partner/blockiert
        */
        verified: Boolean
        theme: Color
        keksbox?: {
                id: string,
                server?: GuildData,
                spawnrate?: number, //Durchschnittliche Anzahl zw. KeksBoxen
                channels?: Array<Discord.Snowflake>, //Channel Whitelist
                message?: Discord.MessageResolvable, //Nachricht vom Paket
                multiplier?: number, //Für besondere KeksBoxen
                keepmessage?: boolean, //Ob die Nachricht beim claimen gelöscht werden soll
                channel?: Discord.Snowflake, //Channel für die Nachricht
        }
    }

    interface UserData {
        __modules?: DbSchemas
        id?: string,
        xp?: number,
        level?: number,
        cookies?: number,
        badges?: number,
        banned?: number,
        banreason?: string,
        inventory?: {
            id: string
            user?: UserData
            items: Array<DbInventoryItem>
        }
        battle?: {
            id: string
            user?: UserData
            stats: Discord.Collection<Stats, StatOptions>
            ready: boolean,
            priority: string,
            hp: number,
            healTimestamp: number
            attacks: string[],
            class: string
        }
        settings?: {
            id: string,
            user?: UserData,
            giftDm: boolean,
        }

        //Stystemuser
        sysUserName?: string
        boundTo?: UserData
        boundSysUser?: UserData
        boundId?: string
        loggedInAs?: UserData
        loggedInUser?: UserData
        loggedInId?: string
        sysUserPassword?: string
        sysUserPermissionLevel?: number
    }

    interface BattleUser {
        user: Discord.User
        member: Discord.GuildMember
        interaction: Discord.ButtonInteraction | Discord.SelectMenuInteraction
        battle: UserData['battle']
        id: string
        team: number
        stats: {
            name: string
            value: number
            getValue?: () => number
        }[]
        attacks: { id: string, uses: number }[]
        color: Color
        name: string
        move?: {
            targets?: string[],
            action: string,
            user: BattleUser
        }
        statChanges?: UserData['battle']['stats']
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

    type CommandOptions = Discord.ApplicationCommandData & {
        cooldown?: number
        battlelock?: boolean
        before?: any
        global?: boolean
        execute(interaction: Discord.CommandInteraction, args: any, client: Discord.Client): any
    }

    type AutocompleteOptions = {
        name: string,
        option: string,
        execute(interaction: Discord.AutocompleteInteraction): any
    }

    interface BattleAction extends DbInventoryItem, BattleActionBuilder {
        id: undefined | string
    }

    interface BattleActionBuilder {
        id: string
        name: string
        type: string
        description: string
        uses?: number
        strength?: number
        priority?: number
        targets?: number
        accuracy?: number
        onUse?(battle: BaseBattle, user: BattleUser, targets: BattleUser[]): Promise<string | void> | string | void
        onInvUse?(item: BattleAction, user: Discord.User, interaction: Discord.ButtonInteraction): any
        onLoad?(this: BattleAction): void
        aHeal?: {
            onTarget?: boolean // Anwender oder Ziel 
            value: number
        }
        rHeal?: {
            onTarget?: boolean // Anwender oder Ziel 
            value: number
        }
        modifiedSkills?: {
            name: string
            value: number
            onTarget?: boolean // Anwender oder Ziel 
            probability?: number
        }[],
        fightUsable?: boolean
        usageMessage?: string
        emote?: string
        inventoryUsable?: boolean
        inventoryMessage?: string
        value?: number
        purchasable?: boolean
        storeOptions?: {
            metadata: any[]
            onLoad(this: BattleAction, metadata: number): BattleAction
        }
    }

    interface DbInventoryItem {
        id: string
        count: number
        metadata?: {
            name?: string
            prefix?: string
            suffix?: string
            description?: string
            emote?: string
            [key: string]: any
        }
    }

    type DbSchemas = ('usersettings' | 'userinventory' | 'userbattle' | 'serverkeksbox')[]

    type PlayerClass = {
        id: string,
        translations: Record<languages, string>
        description: Record<languages, string>
        fullDescription: Record<languages, string>
        baseStats: Record<Stats, number>
        statIncrement: Partial<Record<Stats, number>>
        statIncrementDelta: Partial<Record<Stats, number>>
    }
}