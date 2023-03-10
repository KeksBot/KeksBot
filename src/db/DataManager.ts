import { getData, update } from "."

export default class DataManager {

    //TODO: ID ändern bei systemusern

    protected modules: DbSchemas
    public data
    protected id: string

    constructor(id: string, data?: any, modules: DbSchemas = []) {
        this.data = data
        this.modules = modules
        this.id = id
    }

    protected async _fetch(schema: 'server' | 'user', id: string, modules?: DbSchemas) {
        this.modules = this.modules.concat(modules) as DbSchemas
        this.data = await getData(schema, id, this.modules) || {}
        if(!Object.keys(this.data).length) return null
        return this.data
    }

    protected async _save(schema: 'server' | 'user', id: string) {
        this.data = await update(schema, id, this.data)
        return this.data
    }
}