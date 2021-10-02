(async function() {
    console.log(await require('./getData')('userdata', '514089658833960963'))
    console.log(await require('./update')('userdata', '514089658833960963', {xp: 200, lv: 3}))
})()