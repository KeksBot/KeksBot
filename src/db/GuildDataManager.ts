import { DataManager } from ".";

export default class GuildDataManager extends DataManager { //@ts-ignore
    public data: GuildData = {}

    constructor(id: string, data?: GuildData, modules: DbSchemas = []) {
        super(id, data, modules)
    }

    public async fetch(modules?: DbSchemas): Promise<GuildData> {
        return await this._fetch('server', this.id, modules)
    }

    public async save(): Promise<GuildData> {
        return await this._save('server', this.id)
    }
}