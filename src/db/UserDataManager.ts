import DataManager from "./DataManager";
import { Collection } from "@discordjs/collection";

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
                get: function () { //@ts-expect-error
                    if (this.auto_cache["stat/" + stat]?.expires > Date.now()) return this.auto_cache["stat/" + stat].value; //@ts-expect-error
                    this.auto_cache["stat/" + stat] = { //@ts-expect-error
                        value: (this.data.battle.stats.get(stat).base + this.data.battle.stats.get(stat).increment + this.data.battle.stats.get(stat).absModifier) * //@ts-expect-error
                            this.data.battle.stats.get(stat).randomness * (this.data.battle.stats.get(stat).priority || 1) * this.data.battle.stats.get(stat).relModifier,
                        expires: Date.now() + 600000
                    }; //@ts-expect-error
                    return this.auto_cache["stat/" + stat].value;
                }.bind(this as UserDataManager)
            })
        }
    }

    public async fetch(modules?: DbSchemas): Promise<UserData> {
        await this._fetch('user', this.id, modules)
        if(this.data?.battle?.stats) this.data.battle.stats = new Collection(this.data.battle.stats)
        return this.data
    }

    public async save(): Promise<UserData> {
        let data: any = {...this.data}
        if(data.battle?.stats) data.battle.stats = Array.from(data.battle.stats)
        await this._save('user', this.id, data)
        return this.data
    }

    public reloadStats() {
        this.auto_cache.stats = {}
    }
}