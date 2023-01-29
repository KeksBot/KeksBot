import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const modules = ['loggedInAs', 'keksbox', 'settings', 'battle', 'inventory']

async function set(schema: 'user' | 'server', id: string, data: any): Promise<any> {
    console.log(data)
    const _data = {...data}
    for (const d in _data) {
        if(d.startsWith('__') || (modules.includes(d) && !_data[d])) delete _data[d]
        if(modules.includes(d) && _data[d]) {
            _data[d] = {
                upsert: {
                    create: Object.assign({ id }, _data[d]),
                    update: _data[d]
                }
            }
        }
    }
    const options: any = {
        where: { id },
        create: Object.assign({ id }, _data),
        update: _data
    } //@ts-ignore
    data = await prisma[schema].upsert(options)
    return data
}

export default set

Guild.prototype.setData = async function(value) {
    this.data = await set('server', this.data?.id || this.id, value)
    return this.data
}

User.prototype.setData = async function(value) {
    this.data = await set('user', this.data?.id || this.id, value)
    return this.data
}

User.prototype.save = async function() {
    return await this.setData(this.data)
}

Guild.prototype.save = async function() {
    return await this.setData(this.data)
}