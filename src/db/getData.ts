import db from './database'
import update from './update'
import { Collection, User, Guild } from 'discord.js'
import serverdata from '../schemas/serverdata'
import userdata from '../schemas/userdata'
const schemas = new Collection()
schemas.set('serverdata', serverdata)
schemas.set('userdata', userdata)

async function handle(data: any, name: string) {
    var changed = false
    let id = data._id
    switch(name) {
        case 'userdata': 
            if(data.banned?.time && data.banned.time != -1 && data.banned.time < Date.now()) {
                data.banned = null
                changed = true
            }
            if(changed) await update('userdata', id, { banned: data.banned })
            if(data.system?.user) {
                data = await get('userdata', data.system.user) || data
                if(!data.system) data.system = {}
                data.system.discordUser = id
            }
    }
    return data
}

/**
 * 
 * @param {string} name Name des Tables
 * @param {string} id Discord ID des Objekts
 * @returns {Promise<any>} Zu ladende Daten
 */
async function get(name: string, id: string) {
    /** @type {Model} */
    let model: any = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let data = await model.findById(id)
        if(data) data = await handle(data, name)
        return data?._doc || data
    } catch (error) {
        return error
    }
}

export default get

Guild.prototype.getData = async function() {
    this.data = await get('serverdata', this.id)
    return this.data
}

User.prototype.getData = async function() {
    this.data = await get('userdata', this.id)
    return this.data
}