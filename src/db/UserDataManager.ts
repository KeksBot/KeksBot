import DataManager from "./DataManager";
import { Collection } from "@discordjs/collection"; //@ts-ignore
import cloneDeep from "lodash.clonedeep";

import stats from '../battle/stats'

export default class UserDataManager extends DataManager {
    public data: UserData = {}
    public auto: {
        stats: {
            [key in Stats]?: number
        }
    } = {
        stats: {}
    }
    protected auto_cache: any = {}

    constructor(id: string, data?: UserData, modules: DbSchemas = []) {
        super(id, data, modules)        
        // init stats
        for (const stat of stats) {
            Object.defineProperty(this.auto.stats, stat, {
                get: () => { 
                    if (this.auto_cache["stat/" + stat]?.expires > Date.now()) return this.auto_cache["stat/" + stat].value; 
                    this.auto_cache["stat/" + stat] = { //@ts-expect-error
                        value: (this.data.battle.stats.get(stat).base + this.data.battle.stats.get(stat).increment + this.data.battle.stats.get(stat).absModifier) * //@ts-expect-error
                            this.data.battle.stats.get(stat).randomness * (this.data.battle.stats.get(stat).priority || 1) * this.data.battle.stats.get(stat).relModifier,
                        expires: Date.now() + 600000
                    };
                    return this.auto_cache["stat/" + stat].value;
                }
            })
        }
    }

    public async fetch(modules?: DbSchemas): Promise<UserData> {
        await this._fetch('user', this.id, modules)
        if(this.data?.battle?.stats) this.data.battle.stats = new Collection(this.data.battle.stats) //@ts-ignore
        if(this.data?.battle?.healTimestamp) this.data.battle.healTimestamp = this.data.battle.healTimestamp.getTime()
        return this.data
    }

    public async save(): Promise<UserData> {
        let data: any = cloneDeep(this.data)
        if(data.battle?.stats) data.battle.stats = Array.from(data.battle.stats)
        if(data.battle?.healTimestamp) data.battle.healTimestamp = new Date(data.battle.healTimestamp)
        await this._save('user', this.id, data)
        return this.data
    }

    public reloadStats() {
        this.auto_cache.stats = {}
    }
}