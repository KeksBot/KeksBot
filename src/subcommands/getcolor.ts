export default async (guild: any): Promise<Color> => {
    if(!guild) return { red: 0xE62535, yellow: 0xF2E03F, lime: 0x25D971, normal: 0x00b99b }
    if(!guild.data) guild.data = await guild.getData()
    if(guild.data?.theme) {
        let { 
            red = 0xE62535, 
            yellow = 0xF2E03F, 
            lime = 0x25D971,
            normal = 0x00b99b
        } = guild.data.theme

        if(normal == 'role') normal = guild.members.me?.displayHexColor || 0x00b99b
        return { red, yellow, lime, normal }
    } else return { red: 0xE62535, yellow: 0xF2E03F, lime: 0x25D971, normal: 0x00b99b }
}