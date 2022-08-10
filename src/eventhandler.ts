import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'

export default async (client: Discord.Client) => {
    let events: any[] = []
    const readEvents = async (dir: string) => {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for(const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file))
            if(stat.isDirectory()) {
                readEvents(path.join(dir, file))
            } else {
                if(file.endsWith('.js') && !file.startsWith('subevent')) {
                    var event = await import(path.join(__dirname, dir, file))
                    event.path = path.join(__dirname, dir, file)
                    if(event.name && event.on && event.event) {
                        console.log(`[${client.user.username}]: Event ${event.name} (${event.event}) wird geladen...`)
                    }
                    if(event.on) events.push(event)
                }
            }
        }
    }
    console.log(`[${client.user.username}]: Events werden geladen.`)
    readEvents('./events')
    console.log(`[${client.user.username}]: Events geladen.`)

    events.forEach(event => {
        if(event.event !== 'ready') {
            if(event.once) {client.once(event.event, (...args) => event.on(...args, client))}
            else {client.on(event.event, (...args) => {
                event.on(...args, client)
            })}
        } else event.on(client)
    })
}