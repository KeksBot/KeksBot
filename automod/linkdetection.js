const discord = require('discord.js')
const delay = require('delay')
const linkify = require('linkifyjs')


module.exports = async (msg, serverdata) => {
    var links = linkify.find(msg.content, 'url')
    //if(msg.member.hasPermission('MANAGE_MESSAGES')) return
    var temp = false
    serverdata.amconfig.links.rolewl.forEach(role => {
        if(msg.member.roles.has(role)) temp = true
    })
    if(temp) return
    if(serverdata.amconfig.links.channelwl.includes(msg.channel.id)) return
    if(!links || links.length == 0) return false
    links.forEach(link => {
        var url = link.href.split('/').slice(0, 3).join('/').replace('www.','').split('//')
        url[0] = url[0].replace('https', 'http')
        url = url.join('//')
        var temp = false
        if(serverdata.amconfig.links.linkwl) {
            serverdata.amconfig.links.linkwl.forEach(wllink => {
                if(wllink === url) temp = true
            })
        }
        if(link.href.split('//')[1].startsWith('discord.gg/') || link.href.split('//')[1].startsWith('www.discord.gg/') || link.href.split('//')[1].startsWith('discord.com/invite/') || link.href.split('//')[1].startsWith('www.discord.com/invite/')) temp = true
        if(temp) links.splice(links.indexOf(link), 1)
    })
    if(links.length > 0) {
        var text = 'AutoMod: Nachricht enthält Links:'
        links.forEach(link => {
            text += `\n${link.href}`
        })
        if(msg.content.toLowerCase().startsWith(serverdata.prefix.toLowerCase()) || msg.content.startsWith('<@774885703929561089>') || msg.content.startsWith('<@!774885703929561089>')) {
            msg.delete({reason: text, timeout: 1000}).catch()
        } else {
            msg.delete({reason: text}).catch()
        }
    }
}