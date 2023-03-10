import { User, Guild } from 'discord.js'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

const modules = ['loggedInAs', 'keksbox', 'settings', 'battle', 'inventory']

async function set(schema: 'user' | 'server', id: string, data: any): Promise<any> {

    //TODO: this

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
    console.log(JSON.stringify(_data, null, 2))
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