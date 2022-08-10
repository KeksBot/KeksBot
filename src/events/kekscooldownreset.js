module.exports = {
    name: 'Reset Keks Cooldown',
    event: 'ready',
    once: true,
    on() {
        setInterval(async function() {
            const servermodel = require('../schemas/serverdata')
            const usermodel = require('../schemas/userdata')
            try {
                await usermodel.updateMany({ "thismin": { $ne: 0 } }, { thismin: 0 })
                await servermodel.updateMany({ "thismin": { $ne: 0 } }, { thismin: 0 })
            } catch (error) {
                console.error
            }
        }, 60000)
    } 
}