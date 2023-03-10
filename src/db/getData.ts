import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
import UserDataManager from './UserDataManager'
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
    modules?.forEach(m => {
        if(m.includes('/')) {
            if(typeof include[m.split('/')[0].replaceAll(/user|server/g, '')] !== 'object') include[m.split('/')[0].replaceAll(/user|server/g, '')] = { include: {} } //Nur falls Items irgendwann einzeln gespeichert werden
            include[m.split('/')[0].replaceAll(/user|server/g, '')].include[m.split('/')[1].replaceAll(/user|server/g, '')] = true
        } else !include[m.replaceAll(/user|server/g, '')] ? include[m.replaceAll(/user|server/g, '')] = true : null
    })
    // if(schema == 'user') include.loggedInAs = modules?.length ? { include } : true
    const options: any = {
        where: {
            id
        },
        include: Object.keys(include).length ? include : undefined
    }
    console.log(options)
    //@ts-ignore
    let data = await prisma[schema].findUnique(options)
    // TODO: handle
    return data
}

export default get

Guild.prototype.getData = async function(modules: DbSchemas = ['serverkeksbox']) {
    this.storage.fetch(modules)
    return this.storage.data
}

User.prototype.getData = async function(modules: DbSchemas = ['usersettings', 'userinventory', 'userbattle']) {
    this.storage.fetch(modules)
    return this.storage.data
}

User.prototype.load = async function(modules: DbSchemas = ['usersettings', 'userinventory', 'userbattle']) {
    if(!this.storage) this.storage = new UserDataManager(this.id)
    await this.storage.fetch(modules)
    if(!this.storage.data) {
        await this.create()
    }
    return this.storage.data
}