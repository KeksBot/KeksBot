import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const usermodules = ['settings', 'battle', 'inventory']
const servermodules = ['keksbox']

async function create(schema: 'user' | 'server', id: string): Promise<any> {
    const data: any = {}
    if(schema == 'user') {
        usermodules.forEach(m => data[m] = { create: {}})
    } else if(schema == 'server') {
        servermodules.forEach(m => data[m] = { create: {}})
    }

    const options: any = {
        data: Object.assign({ id }, data),
    } //@ts-ignore
    data = await prisma[schema].create(options)
    return data
}

User.prototype.create = async function() {
    return await create('user', this.id)
}

Guild.prototype.create = async function() {
    return await create('server', this.id)
}