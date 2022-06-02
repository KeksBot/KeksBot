const discord = require('discord.js')
const update = require('../../../db/update')

module.exports = async function(ita, args) {
    const { guild, color } = ita
    if(args.instant_modactions) {
        let instant = guild.data.settings?.instant_modactions || 0
        let input = 0
        input |= args.instant_modactions == 'ban' ? 0b1000 : 
            args.instant_modactions == 'kick' ? 0b0100 :
            args.instant_modactions == 'timeout' ? 0b0010 :
            args.instant_modactions == 'warn' ? 0b0001 : 0
        instant ^= input
        instant = args.instant_modactions == 'skip-all' ? 15 : 
            args.instant_modactions == 'check-all' ? 0 : instant
        if(!guild.data.settings) guild.data.settings = {}
        guild.data.settings.instant_modactions = instant
        await update('serverdata', guild.id, { settings: guild.data.settings })
    }
    if(args.dm_users) {
        let config = guild.data.settings?.dm_users || 0
        let input = 0
        input |= args.dm_users == 'ban' ? 0b1000 : 
            args.dm_users == 'kick' ? 0b0100 :
            args.dm_users == 'timeout' ? 0b0010 :
            args.dm_users == 'warn' ? 0b0001 : 0
        config ^= input
        config = args.dm_users == 'send-all' ? 15 : 
            args.dm_users == 'send-none' ? 0 : config
        if(!guild.data.settings) guild.data.settings = {}
        guild.data.settings.dm_users = config
        await update('serverdata', guild.id, { settings: guild.data.settings })
    }
    let embed = new discord.MessageEmbed()
        .setTitle('Moderationseinstellungen')
        .setColor(color.normal)
        .addField('Instant Modactions', '`/settings moderation instant-modactions`\n' + 
            'Mit ⏹️ angezeigte Aktionen müssen überprüft werden, Aktionen, vor denen ein ⏩ steht, werden sofort ausgeführt.\n' + 
            (() => {
                let instant = guild.data.settings?.instant_modactions || 0
                return (() => { if(instant & 0b1000) return '⏩ Ban'; return '⏹️ Ban' })() + '\n' +
                    (() => { if(instant & 0b0100) return '⏩ Kick'; return '⏹️ Kick' })() + '\n' +
                    (() => { if(instant & 0b0010) return '⏩ Timeout'; return '⏹️ Timeout' })() + '\n' +
                    (() => { if(instant & 0b0001) return '⏩ Warnung'; return '⏹️ Warn' })()
            })(), true)
        .addField('Nutzer informieren', '`/settings moderation dm-users`\n' + 
            'Bei mit ℹ️ markierten Aktionen wird der Nutzer über eine Direktnachricht informiert.\n' +
            (() => {
                let config = guild.data.settings?.dm_users || 0
                return (() => { if(config & 0b1000) return 'ℹ️ Ban'; return '⏹️ Ban' })() + '\n' +
                    (() => { if(config & 0b0100) return 'ℹ️ Kick'; return '⏹️ Kick' })() + '\n' +
                    (() => { if(config & 0b0010) return 'ℹ️ Timeout'; return '⏹️ Timeout' })() + '\n' +
                    (() => { if(config & 0b0001) return 'ℹ️ Warnung'; return '⏹️ Warn' })()
            })(), true)
    return ita.reply({ embeds: [embed], ephemeral: true })
}