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

async function handle(data, name, id) {
    var changed = false
    switch(name) {
        case 'userdata': 
            if(data.banned?.time && data.banned.time < Date.now()) {
                data.banned = null
                changed = true
            }
            if(changed) await require('./update')('userdata', id, { banned: data.banned })
    }
}

/**
 * 
 * @param {string} name Name des Tables
 * @param {string} id Discord ID des Objekts
 * @returns {Promise<object>} Zu ladende Daten
 */
module.exports = async function(name, id) {
    /** @type {Model} */
    let model = schemas.get(name)
    if(!model) return new Error('404: Model not found')
    await db()
    try {
        let data = await model.findById(id)
        if(data) await handle(data, name, id)
        return data
    } catch (error) {
        return error
    }
}