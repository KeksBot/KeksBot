const update = require('./db/update')
const userdata = require('./userdata.json')
const serverdata = require('./serverdata.json')
const config = require('./config.json')

async function main() {
    global.cache = require('./db/startup.js')
    for (const i in serverdata) {
        let data = serverdata[i]
        var output = {}
        if(data.xp) output.xp = data.xp
        if(data.lv) {
            if(data.lv > 5) output.level = 5
            else output.level = data.lv
        }
        if(data.partner) output.partner = 2
        if(data.verified) output.verified = true
        if(data.kbq || data.cwl) output.keksbox = {}
        if(data.kbq) output.keksbox.spawnrate = data.kbq
        if(data.cwl && data.cwl.length) output.keksbox.channels = data.cwl
        if(data.theme || data.color) output.theme = {}
        if(data.theme) output.theme = data.theme
        if(data.color) output.theme.normal = data.color
        await update('serverdata', i, output)
    }
    for (const i in userdata) {
        let data = userdata[i]
        var output = {}
        if(data.xp) output.xp = data.xp
        if(data.lv) output.level = data.lv
        if(data.cookies) output.cookies = data.cookies
        if(data.giftdm) output.giftdm = true
        if(config.mods.includes(i) || config.devs.includes(i) || require('./VIP.json')[i] || data.partner || data.firsthour) {
            output.badges = {}
            if(config.mods.includes(i)) output.badges.mod = true
            if(config.devs.includes(i)) output.badges.dev = true
            if(require('./VIP.json')[i]) output.badges.vip = true
            if(data.partner) output.badges.partner = true
            if(data.firsthour) data.beta = true
        }
        await update('userdata', i, output)
    }
    process.exit(1)
}

main()
