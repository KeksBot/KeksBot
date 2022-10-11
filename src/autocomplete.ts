import fs from 'fs'
import path from 'path'
import Discord from 'discord.js'

export default async (client: Discord.Client) => {
    const autocompletes = new Discord.Collection<String, AutocompleteOptions>()

    const readEvents = async (dir: string) => {
        const files = fs.readdirSync(path.join(__dirname, dir))
        for(const file of files) {
            const stat = fs.lstatSync(path.join(__dirname, dir, file))
            if(stat.isDirectory()) {
                readEvents(path.join(dir, file))
            } else {
                if(file.endsWith('.js') && !file.startsWith('subevent')) {
                    let { default: event } = await import(path.join(__dirname, dir, file))
                    if(!event.name && !event.option) continue
                    autocompletes.set(`${event.name}/${event.option}`, event)
                    console.log(`[${client.user.username}]: Autocomplete ${event.name} (${event.option}) wird geladen.`)
                }
            }
        }
    }
    console.log(`[${client.user.username}]: Autocomplete Interactions werden geladen.`)
    await readEvents('./autocomplete')
    console.log(`[${client.user.username}]: Autocomplete Interactions geladen.`)

    //@ts-ignore
    client.on('interactionCreate', async (interaction: Discord.AutocompleteInteraction) => {
        if(!interaction.isAutocomplete()) return
        const focused = interaction.options.getFocused(true)
        if(!autocompletes.has(`${interaction.commandName}/${focused.name}`)) return
        autocompletes
            .get(`${interaction.commandName}/${focused.name}`)
            .execute(interaction)
            // .catch(async () => {
            //     if(!interaction.responded) await interaction.respond([]).catch(() => {})
            // })
    })
}