const db = require('./database')
const path = require('path')
const fs = require('fs')
const { Collection } = require('discord.js')
const { Model } = require('mongoose')
const schemas = new Collection()

const readCommands = dir => {
    const files = fs.readdirSync(dir)
    for(const file of files) {
        const stat = fs.lstatSync(path.join(dir, file))
        if(stat.isDirectory()) {
            readCommands(path.join(dir, file))
        } else {
            if(file.endsWith('.js')) {
                /** @type {Model} */
                let model = require(path.join(dir, file))
                schemas.set(model.modelName, model)
            }
        }
    }
}
readCommands(path.join(__dirname, '../schemas'))

/**
 * 
 * @param {String} name Name des zu verwendenden Schemas
 * @param {String} id Discord ID
 * @param {Object} data Zusätzliche Daten
 */
module.exports = async function(name, id, data) {
    /** @type {Model} */
    let model = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let exists = await model.findById(id)
        if(exists) {
            global.cache.get(name).set(id, exists)
            return exists
        }
        let object = {_id: id}
        if(!data) data = {}
        Object.assign(object, data)
        await global.cache.get(name).set(id, await model.create(object))
        return global.cache.get(name).get(id)
    } catch (error) {
        return error
    }
}