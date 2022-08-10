import db from './database'
import path from 'path'
import fs from 'fs'
import update from './update'
import { Collection, User, Guild } from 'discord.js'
const schemas = new Collection()

const readCommands = async (dir: string) => {
    const files = fs.readdirSync(dir)
    for(const file of files) {
        const stat = fs.lstatSync(path.join(dir, file))
        if(stat.isDirectory()) {
            readCommands(path.join(dir, file))
        } else {
            if(file.endsWith('.js')) {
                /** @type {Model} */
                let model = await import(path.join(dir, file))
                schemas.set(model.modelName, model)
            }
        }
    }
}
readCommands(path.join(__dirname, '../schemas'))

async function handle(data: any, name: string, id: string) {
    var changed = false
    switch(name) {
        case 'userdata': 
            if(data.banned?.time && data.banned.time != -1 && data.banned.time < Date.now()) {
                data.banned = null
                changed = true
            }
            if(changed) await update('userdata', id, { banned: data.banned })
    }
}

/**
 * 
 * @param {string} name Name des Tables
 * @param {string} id Discord ID des Objekts
 * @returns {Promise<any>} Zu ladende Daten
 */
export default async function(name: string, id: string) {
    /** @type {Model} */
    let model: any  = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let data = await model.findById(id)
        if(data) await handle(data, name, id)
        return data?._doc || data
    } catch (error) {
        return error
    }
}

Guild.prototype.getData = async function() {
    this.data = await module.exports('serverdata', this.id)
    return this.data
}

User.prototype.getData = async function() {
    this.data = await module.exports('userdata', this.id)
    return this.data
}