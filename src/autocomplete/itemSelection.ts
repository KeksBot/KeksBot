import Discord from 'discord.js'
import objectLoader from '../game/objectLoader'

const options: AutocompleteOptions = {
    name: 'item',
    option: 'item',
    async execute(interaction) {
        const { user } = interaction

        if(!user.data) user.data = await user.getData()
        if(!user.data?.inventory) return interaction.respond([])
        const inventory = user.data.inventory

        let input = interaction.options.getFocused().toLowerCase()
        if(input.length < 3) return interaction.respond([])

        //@ts-ignore
        const items: Discord.Collection<number, BattleActionBuilder & { count: number }> = new Discord.Collection(objectLoader(inventory.map(item => item.id)).entries())
        items.forEach(item => {
            item.count = inventory.find(i => i.id === item.id)?.count || 0
        })

        let results = items.filter(item => item.name.toLowerCase().includes(input)).sort((a, b) => {
            if(a.name.toLowerCase() == input && b.name.toLowerCase() != input) return -1
            if(a.name.toLowerCase() != input && b.name.toLowerCase() == input) return 1
            if(a.name.toLowerCase().startsWith(input) && !b.name.toLowerCase().startsWith(input)) return -1
            if(!a.name.toLowerCase().startsWith(input) && b.name.toLowerCase().startsWith(input)) return 1
        }).array().slice(0, 25)

        // let firstResults = items.filter(i => i.name.toLowerCase() == input).array()
        // let secondResults = items.filter(i => i.name.toLowerCase().startsWith(input)).array().filter(i => !firstResults.includes(i))
        // let thirdResults = items.filter(i => i.name.toLowerCase().includes(input)).array().filter(i => !firstResults.includes(i) && !secondResults.includes(i))

        // let output = [firstResults, secondResults, thirdResults].flat().map(i => { return { name: i.name, value: i.id.toString() } }).slice(0, 25)
        let output = results.map(i => { return { name: i.name, value: i.id.toString() } })

        await interaction.respond(output)
    }
}

export default options