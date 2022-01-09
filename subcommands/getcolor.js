const { Guild } = require("discord.js")

/**
 * 
 * @param {Guild} guild 
 * @returns {Promise<{ red: String, yellow: String, lime: String, normal: String, lightblue: String}>} color object
 */

module.exports = async (guild) => {
    if(!guild) return { red: 0xE62535, yellow: 0xF2E03F, lime: 0x25D971, normal: 0x00b99b }
    if(!guild.data) guild.data = await require('../db/getData')('serverdata', guild.id)
    if(guild.data?.theme) {
        let { 
            red = 0xE62535, 
            yellow = 0xF2E03F, 
            lime = 0x25D971,
            normal = 0x00b99b
        } = guild.data.theme

        if(normal == 'role') normal = guild.me?.displayHexColor || 0x00b99b
        return { red, yellow, lime, normal, lightblue }
    } else return { red: 0xE62535, yellow: 0xF2E03F, lime: 0x25D971, normal: 0x00b99b }
}