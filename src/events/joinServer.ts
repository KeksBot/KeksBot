export default {
    name: 'Automatic Server Setup',
    event: 'guildCreate',
    async on(guild, client) {
        await guild.commands.set(client.commands.array())
    }
}