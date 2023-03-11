import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const modules = ['loggedInAs', 'keksbox', 'settings', 'battle', 'inventory']

async function set(schema: 'user' | 'server', id: string, data: any): Promise<any> {

    const _data = {...data}
    for (const d in _data) {
        if(modules.includes(d) && _data[d]) {
            _data[d] = {
                update: Object.assign(_data[d], { id: undefined })
            }
        }
    }
    const options: any = {
        where: { id },
        data: _data
    } //@ts-ignore
    data = await prisma[schema].update(options)
    return data
}

export default set

Guild.prototype.setData = async function(value) {
    Object.assign(this.storage.data, value)
    await this.storage.save()
    return this.storage.data
}

User.prototype.setData = async function(value) {
    Object.assign(this.storage.data, value)
    await this.storage.save()
    return this.storage.data
}

User.prototype.save = async function() {
    return await this.storage.save()
}

Guild.prototype.save = async function() {
    return await this.storage.save()
}