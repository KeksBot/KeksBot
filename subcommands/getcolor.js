const { Guild } = require("discord.js")

/**
 * 
 * @param {Guild} guild 
 * @returns {Promise<{ red: String, yellow: String, lime: String, normal: String, lightblue: String}>} color object
 */

module.exports = async (guild) => {
    if(!guild) return { red: 0xff0000, lightblue: 0x3498db, lime: 0x2ecc71, yellow: 0xf1c40f, normal: 0x00b99b }
    if(!guild.data) guild.data = await require('../db/getData')('serverdata', guild.id)
    if(guild.data?.theme) {
        let {
            red = 0xe62535,
            lightblue = 0x3498db,
            lime = 0x25d971,
            yellow = 0xf2e03f,
            normal = 0x00b99b
        } = guild.data.theme
        if(normal == 'role') normal = guild.me?.displayHexColor || 0x00b99b
        return { red, yellow, lime, normal, lightblue }
    } else return { red: 0xff0000, lightblue: 0x3498db, lime: 0x2ecc71, yellow: 0xf1c40f, normal: 0x00b99b }
}