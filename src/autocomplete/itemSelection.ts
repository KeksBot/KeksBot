import Discord from 'discord.js'
import objectLoader from '../game/objectLoader'

const options: AutocompleteOptions = {
    name: 'item',
    option: 'item',
    async execute(interaction) {
        const { user } = interaction

        if(!user.data) user.data = await user.getData()
        if(!user.data?.battle?.inventory) return interaction.respond([])
        const inventory = user.data.battle.inventory

        let input = interaction.options.getFocused().toLowerCase()
        if(input.length < 3) return interaction.respond([])

        //@ts-ignore
        const items: Discord.Collection<number, BattleActionBuilder & { count: number }> = new Discord.Collection(objectLoader(inventory.map(item => item.id)).entries())
        items.forEach(item => {
            item.count = inventory.find(i => i.id === item.id)?.count || 0
        })

        let firstResults = items.filter(i => i.name.toLowerCase() == input).array()
        let secondResults = items.filter(i => i.name.toLowerCase().startsWith(input)).array().filter(i => !firstResults.includes(i))
        let thirdResults = items.filter(i => i.name.toLowerCase().includes(input)).array().filter(i => !firstResults.includes(i) && !secondResults.includes(i))

        let output = [firstResults, secondResults, thirdResults].flat().map(i => { return { name: i.name, value: i.id.toString() } }).slice(0, 25)

        await interaction.respond(output)
    }
}

export default options