import getData from "./getData"
import update from "./update"

export default class DataManager {

    //TODO: ID ändern bei systemusern

    protected modules: DbSchemas
    protected id: string
    protected auto_cache: any
    public data
    public expires: Date = new Date(Date.now() + 60000)
    public auto: any

    constructor(id: string, data?: any, modules: DbSchemas = []) {
        this.data = data
        this.modules = modules
        this.id = id
    }

    protected async _fetch(schema: 'server' | 'user', id: string, modules?: DbSchemas) {
        this.modules = this.modules.concat(modules) as DbSchemas
        this.data = await getData(schema, id, this.modules) || null
        this.expires = new Date(Date.now() + 60000)
        return this.data
    }

    protected async _save(schema: 'server' | 'user', id: string) {
        this.data = await update(schema, id, this.data)
        this.expires = new Date(Date.now() + 60000)
        return this.data
    }
}