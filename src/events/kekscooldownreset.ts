import { Client } from 'discord.js'

export default {
    name: 'Reset Keks Cooldown',
    event: 'ready',
    once: true,
    on(client: Client) {
        setInterval(async function() {
            client.thismin?.clear()
        }, 60000)
    } 
}