import db from './database'
import path from 'path'
import fs from 'fs'
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
/**
 * 
 * @param {String} name Name des Schemas
 * @param {String} id Discord ID
 * @param {Object} value Datenwerte
 */
export default async function(name: string, id: string, value: any) {
    /** @type {Model} */
    let model: any = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let data = await model.findOneAndUpdate({
            _id: id
        }, value, {
            upsert: true,
            strict: false,
            new: true
        })
        return data
    } catch (error) {
        return error
    }
}

Guild.prototype.setData = async function(value) {
    this.data = await module.exports('serverdata', this.id, value)
    return this.data
}

User.prototype.setData = async function(value) {
    this.data = await module.exports('userdata', this.id, value)
    return this.data
}

User.prototype.save = async function() {
    return await this.setData(this.data)
}

Guild.prototype.save = async function() {
    return await this.setData(this.data)
}