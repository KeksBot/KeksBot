const fs = require('fs')
const path = require('path')
const { Collection } = require('discord.js')

module.exports = {
    name: 'Leerung von gecachten Datensätzen',
    event: 'ready',
    once: true,
    async on() {
        var date = new Date()
        var hours = date.getHours()
        setInterval(() => {
            date = new Date()
            if(hours !== date.getHours()) {
                var cache = new Collection()
            
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
                
                global.cache = cache
            }
            hours = date.getHours()
        }, 60000)
    }
}