const discord = require('discord.js')
const client  = new discord.Client({ intents: ['GUILDS', 'GUILD_BANS', 'GUILD_MEMBERS', 'GUILD_INVITES', 'GUILD_EMOJIS_AND_STICKERS', 'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 'GUILD_VOICE_STATES', 'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS']})

client.on('ready', () => {
    const guild = client.guilds.fetch('775001585541185546')
    const user = '762258987680530452'
    guild.
})

client.login(require('./config.json').token)