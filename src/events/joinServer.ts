// @ts-nocheck
export default {
    name: 'Automatic Server Setup',
    event: 'guildCreate',
    async on(guild, client) {
        await guild.commands.set(client.commands.filter(c => !c.global).array())
        await guild.create()
    }
}