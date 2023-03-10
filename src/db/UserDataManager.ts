import DataManager from "./DataManager";

export default class UserDataManager extends DataManager {
    public data: UserData = {}

    constructor(id: string, data?: UserData, modules: DbSchemas = []) {
        super(id, data, modules)
    }

    public async fetch(modules?: DbSchemas): Promise<UserData> {
        return await this._fetch('user', this.id, modules)
    }

    public async save(): Promise<UserData> {
        return await this._save('user', this.id)
    }
}