import Discord from 'discord.js'
import objectLoader from '../game/objectLoader' //@ts-ignore

const options: AutocompleteOptions = {
    name: 'item',
    option: 'item',
    async execute(interaction) {
        const { user } = interaction

        if(!user.storage) await user.load()
        if(!user.storage.data) user.storage.data = await user.getData()
        if(!user.storage.inventory?.size) return interaction.respond([])
        const inventory = user.storage.inventory

        let input = interaction.options.getFocused().toLowerCase()
        if(input.length < 3) return interaction.respond([])

        //@ts-ignore
        const items: BattleAction[] = inventory.map((i, uniqueId) => {
            //@ts-ignore
            let item = Object.assign({...i}, objectLoader(inventory.map(item => item.id)).get(i.id))
            item.onLoad && item.onLoad.call(item)
            return item
        })

        let results = items.filter(item => item.name.toLowerCase().includes(input)).sort((a, b) => {
            if(a.name.toLowerCase() == input && b.name.toLowerCase() != input) return -1
            if(a.name.toLowerCase() != input && b.name.toLowerCase() == input) return 1
            if(a.name.toLowerCase().startsWith(input) && !b.name.toLowerCase().startsWith(input)) return -1
            if(!a.name.toLowerCase().startsWith(input) && b.name.toLowerCase().startsWith(input)) return 1
        }).slice(0, 25)

        // let firstResults = items.filter(i => i.name.toLowerCase() == input).array()
        // let secondResults = items.filter(i => i.name.toLowerCase().startsWith(input)).array().filter(i => !firstResults.includes(i))
        // let thirdResults = items.filter(i => i.name.toLowerCase().includes(input)).array().filter(i => !firstResults.includes(i) && !secondResults.includes(i))

        // let output = [firstResults, secondResults, thirdResults].flat().map(i => { return { name: i.name, value: i.id.toString() } }).slice(0, 25)
        let output = results.map((i) => { return { name: i.name.title(), value: i.uniqueId } })

        await interaction.respond(output)
    }
}

export default options