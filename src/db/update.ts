import db from './database'
import { Collection, User, Guild } from 'discord.js'
import serverdata from '../schemas/serverdata'
import userdata from '../schemas/userdata'
const schemas = new Collection()
schemas.set('serverdata', serverdata)
schemas.set('userdata', userdata)

/**
 * 
 * @param {String} name Name des Schemas
 * @param {String} id Discord ID
 * @param {Object} value Datenwerte
 */
async function set(name: string, id: string, value: any) {
    /** @type {Model} */
    let model: any = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let data = await model.findOneAndUpdate({
            _id: id
        }, value, {
            upsert: true,
            strict: true,
            new: true
        })
        return data
    } catch (error) {
        return error
    }
}
export default set

Guild.prototype.setData = async function(value) {
    this.data = await set('serverdata', this.data._id, value)
    return this.data
}

User.prototype.setData = async function(value) {
    this.data = await set('userdata', this.data._id, value)
    return this.data
}

User.prototype.save = async function() {
    return await this.setData(this.data)
}

Guild.prototype.save = async function() {
    return await this.setData(this.data)
}