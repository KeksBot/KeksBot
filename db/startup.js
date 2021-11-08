const { Collection } = require('discord.js')
const fs = require('fs')
const cache = new Collection()
const path = require('path')

function readCommands(dir) {
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const stat = fs.lstatSync(path.join(dir, file))
        if(stat.isDirectory()) readCommands(path.join(dir))
        else {
            if(file.endsWith('.js')) {
                let model = require(path.join(dir, file))
                cache.set(model.modelName, new Collection())
            }
        }
    }
}

readCommands(path.join(__dirname, '../schemas'))

module.exports = cache