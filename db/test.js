// (async function() {
//     console.log(await require('./getData')('userdata', '514089658833960963'))
//     console.log(await require('./update')('userdata', '514089658833960963', {xp: 200, lv: 3}))
// })()

(async function() {
    global.cache = require('./startup')
    await require('./create')('userdata', '514089658833960963', { xp: 5, lv: 3 }).then(console.log)
    await require('./update')('userdata', '514089658833960963', { xp: 4, lv: 1, badges: { verified: true }}).then(console.log)
    console.log(global.cache.get('userdata').get('514089658833960963'))
})()