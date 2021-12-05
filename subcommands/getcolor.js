const { Guild } = require("discord.js")

/**
 * 
 * @param {Guild} guild 
 * @param {Object} guilddata Daten des Servers. Optional.
 * @returns {Promise<{ red: String, yellow: String, lime: String, normal: String, lightblue: String}>} color object
 */

module.exports = async (guild, guilddata) => {
    if(!guilddata) guilddata = await require('./db/getData')('serverdata', guild.id)
    if(guilddata && guilddata.theme) {
        let {
            red = 0xff0000,
            lightblue = 0x3498db,
            lime = 0x2ecc71,
            yellow = 0xf1c40f,
            normal = 0x00b99b
        } = guilddata.theme
        return { red, yellow, lime, normal, lightblue }
    } else return { red: 0xff0000, lightblue: 0x3498db, lime: 0x2ecc71, yellow: 0xf1c40f, normal: 0x00b99b }
}