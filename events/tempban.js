const update = require('../db/update')
const serverdata = require('../schemas/serverdata')

module.exports = {
    name: 'Unban',
    once: true,
    event: 'ready',
    async on(client) {
        await require('../db/database')()
        for await (const data of serverdata.find({ tempbans: { $exists: true } })) {
            var guild
            try { guild = await client.guilds.fetch(data._id) } catch {
                try { await serverdata.findByIdAndDelete(data._id) } catch (err) {console.error(err)}
            }
            if(guild) {
                let tempbans = [...data.tempbans]
                data.tempbans.forEach(async function(ban) {
                    if(ban.time <= Date.now()) {
                        try {
                            if(await guild.bans.fetch(ban.user)) {
                                await guild.bans.remove(ban.user)
                                data.tempbans.splice(data.tempbans.indexOf(ban), 1)
                            }
                        } catch {}
                    }
                })
                if(tempbans !== data.tempbans) await update('serverdata', data, { tempbans: data.tempbans })
            } else {
                try { await serverdata.findByIdAndDelete(data._id) } catch (err) {console.error(err)}
            }
        }
        setTimeout(async function() {
            await require('../db/database')()
            for await (const data of serverdata.find({ tempbans: { $exists: true } })) {
                var guild
                try { guild = await client.guilds.fetch(data._id) } catch {
                    try { await serverdata.findByIdAndDelete(data._id) } catch (err) {console.error(err)}
                }
                if(guild) {
                    let tempbans = [...data.tempbans]
                    data.tempbans.forEach(async function(ban) {
                        if(ban.time <= Date.now()) {
                            try {
                                if(await guild.bans.fetch(ban.user)) {
                                    await guild.bans.remove(ban.user)
                                    data.tempbans.splice(data.tempbans.indexOf(ban), 1)
                                }
                            } catch {}
                        }
                    })
                    if(tempbans !== data.tempbans) await update('serverdata', data, { tempbans: data.tempbans })
                } else {
                    try { await serverdata.findByIdAndDelete(data._id) } catch (err) {console.error(err)}
                }
            }
        }, 300000)
    }
}