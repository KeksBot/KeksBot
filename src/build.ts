import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'

const client: Discord.Client = new Discord.Client({ intents: ['Guilds', 'GuildMembers', 'GuildEmojisAndStickers', 'GuildMessages', 'DirectMessages', 'DirectMessageReactions'] })
const commands: any = []
const storeItems: any = {}

const readCommands: any = (dir: string) => {
    const files = fs.readdirSync(path.join(__dirname, dir))
    for(const file of files) {
        const stat = fs.lstatSync(path.join(__dirname, dir, file))
        if(stat.isDirectory()) {
            readCommands(path.join(dir, file))
        } else {
            if(file.endsWith('.js') && !file.startsWith('!')) {
                let { default: command } = require(path.join(__dirname, dir, file))
                if(!command?.name) continue
                if(command.permission) {
                    command.permission = command.permission.toUpperCase()
                }
                console.log(`${command.name} geladen`)
                commands.push(command)
            }
        }
    }
}

const loadStoreItems: any = (dir: string) => {
    const files = fs.readdirSync(path.join(__dirname, dir))
    for(const file of files) {
        const stat = fs.lstatSync(path.join(__dirname, dir, file))
        if(stat.isDirectory()) {
            loadStoreItems(path.join(dir, file))
        } else {
            if(file.endsWith('.js') && !file.startsWith('!')) {
                let { default: item } = require(path.join(__dirname, dir, file))
                if(!item.purchasable) continue
                if(!storeItems[item.type.split('/')[1]]) storeItems[item.type.split('/')[1]] = []
                storeItems[item.type.split('/')[1]].push({
                    item: item.id,
                    price: item.value,
                    name: item.name,
                    description: item.description,
                    emote: item.emote
                })
            }
        }
    }
}

let time = Date.now()
readCommands('./slashcommands')
console.log(`Ladevorgang abgeschlossen (${Date.now() - time}ms)`)

client.once('ready', async () => {
    console.log('Registrierung gestartet')
    let time = Date.now()
    await client.application.commands.set(commands.filter((c: any) => c.global))
    console.log('Global Commands registriert')
    await client.guilds.fetch()
    for(const guild of client.guilds.cache.values()) {
        try {
            await guild.commands.set(commands.filter((c: any) => !c.global))
        } catch (error) {
            console.error(error)
            console.log(`Server nicht geladen: ${guild.id} | ${guild.name}`)
        }
    }
    console.log('Guild Commands registriert')
    console.log(`Registrierung abgeschlossen (${Date.now() - time}ms)`)

    console.log('Store Items werden geladen')
    time = Date.now()
    loadStoreItems('./game/gameobjects/item')
    await fs.promises.writeFile('build/game/store.json', JSON.stringify(storeItems))
    console.log(`Generierung des Stores abgeschlossen (${Date.now() - time}ms)`)
    process.exit()
})

client.login(require('./config.json').token)