import DataManager from "./DataManager";

const stats = ['hp', 'attack', 'defense', 'speed', 'accuracy', 'critrate', 'critdamage', 'regeneration'] as const

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
                        value: (this.data.battle.stats[stat].base + this.data.battle.stats[stat].increment + this.data.battle.stats[stat].absModifier) * //@ts-expect-error
                            this.data.battle.stats[stat].randomness * this.data.battle.stats[stat].priority * this.data.battle.stats[stat].relModifier,
                        expires: Date.now() + 600000
                    }; //@ts-expect-error
                    return this.auto_cache["stat/" + stat].value;
                }.bind(this as UserDataManager)
            })
        }
    }

    public async fetch(modules?: DbSchemas): Promise<UserData> {
        return await this._fetch('user', this.id, modules)
    }

    public async save(): Promise<UserData> {
        return await this._save('user', this.id)
    }

    public reloadStats() {
        this.auto_cache.stats = {}
    }
}