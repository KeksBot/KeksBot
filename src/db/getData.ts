import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

// async function handle(data: any, name: string) {
//     let changed = false
//     let id = data._id
//     switch(name) {
//         case 'userdata': 
//             if(data.banned != -1 && data.banned.time < Date.now()) {
//                 data.banned = 0
//                 changed = true
//             }
//             // TODO: if(changed) await update('userdata', id, { banned: data.banned })
//     }
//     return data
// }

async function get(schema: 'user' | 'server', id: string, modules?: DbSchemas): Promise<any> {
    const include: any = {}
    modules.forEach(m => {
        if(m.includes('/')) {
            if(typeof include[m.split('/')[0].replaceAll(/user|server/g, '')] !== 'object') include[m.split('/')[0].replaceAll(/user|server/g, '')] = { include: {} } //Nur falls Items irgendwann einzeln gespeichert werden
            include[m.split('/')[0].replaceAll(/user|server/g, '')].include[m.split('/')[1].replaceAll(/user|server/g, '')] = true
        } else !include[m.replaceAll(/user|server/g, '')] ? include[m.replaceAll(/user|server/g, '')] = true : null
    })
    include.loggedInAs = modules.length ? { include } : true
    const options: any = {
        where: {
            id
        },
        include
    } //@ts-ignore
    let data = await prisma[schema].findUnique(options)
    // TODO: handle
    data ? data.__modules = modules : { id }
    return data
}

export default get

Guild.prototype.getData = async function(modules?: DbSchemas) {
    this.data.__modules.forEach(m => {
        if(!modules.includes(m)) modules.push(m)
    })
    this.data = await Object.assign(await get('server', this.id, modules) || {}, this.data)
    return this.data
}

User.prototype.getData = async function(modules?: DbSchemas) {
    this.data.__modules.forEach(m => {
        if(!modules.includes(m)) modules.push(m)
    })
    this.data = await Object.assign(await get('server', this.id, modules), this.data)
    return this.data
}