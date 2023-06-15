import DataManager from "./DataManager";
import { Collection } from "@discordjs/collection"; //@ts-ignore
import cloneDeep from "lodash.clonedeep";
import generateUniqueItemId from "../util/generateUniqueItemId";

import stats from '../battle/stats'

function createInventoryCollection() {
    let collection: any = new Collection<string, DbInventoryItem>()
    collection.addItem = (item: DbInventoryItem) => {
        if(!item.uniqueId) item.uniqueId = generateUniqueItemId(item)
        if(!collection.has(item.uniqueId)) collection.set(item.uniqueId, item)
        else {
            let i = collection.get(item.uniqueId)
            i.count += item.count
            collection.set(item.uniqueId, i)
        }
    }
    collection.removeItem = (item: DbInventoryItem) => {
        let i = collection.get(item.uniqueId)
        if(i) {
            i.count -= item.count
            if(i.count == 0) collection.delete(item.uniqueId)
        }
    }
    collection.removeItemById = (uniqueId: string, count: number) => {
        let i = collection.get(uniqueId)
        if(i) {
            i.count -= count
            if(i.count <= 0) collection.delete(uniqueId)
        }
    }
    collection.itemAmount = (uniqueId: string) => {
        return collection.get(uniqueId)?.count
    }
    return collection
}

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
    public inventory: Collection<string, DbInventoryItem> & { 
        addItem: (item: DbInventoryItem) => void
        removeItem: (item: DbInventoryItem) => void
        removeItemById: (uniqueId: string, count: number) => void
        itemAmount: (uniqueId: string) => number
    } = createInventoryCollection()

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
        for(const item of this.data?.inventory?.items || []) {
            this.inventory.set(item.uniqueId, item)
        }
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