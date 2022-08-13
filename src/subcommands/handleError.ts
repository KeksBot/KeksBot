import { ButtonInteraction, CommandInteraction, EmbedBuilder, ModalSubmitInteraction, SelectMenuInteraction } from "discord.js";
import { logChannel } from '../config.json'

export default async (interaction: CommandInteraction | ButtonInteraction | ModalSubmitInteraction | SelectMenuInteraction, error: unknown, args?: any) => {
    try {
        //@ts-ignore
        console.error(`Error while executing ${interaction?.commandName || interaction?.customId} (${interaction?.user?.tag}, ${interaction?.guild?.name}) with arguments: ${args.replaceAll('"', '')}`)
        console.error(error)
        let errorId = (Math.random() * Date.now()).toString(36)
        let channel = await interaction.client.channels.fetch(logChannel)
        let embed = new EmbedBuilder() 
            .setColor('Red')
            //@ts-ignore
            .setTitle(`${errorId} | ${error?.name}`)
            //@ts-ignore
            .setDescription(`**interaction**:\ncommand: /${interaction?.commandName || interaction?.customId}\nuser: <@${interaction?.user?.id}> (${interaction?.user?.id})\nguild: ${interaction?.guild?.name} (${interaction?.guild?.id})`)
            .addFields([
                {
                    name: 'args',
                    value: args.replaceAll('"', '') || 'undefined',
                    inline: true
                },
                {
                    name: 'error',
                    //@ts-ignore
                    value: error.message || 'undefined',
                    inline: true
                },
                {
                    name: 'cause',
                    //@ts-ignore
                    value: error.cause.toString() || 'undefined',
                },
                {
                    name: 'stack',
                    //@ts-ignore
                    value: error.stack || 'undefined',
                }
            ])
        //@ts-ignore
        await channel.send({ embeds: [embed] })
        embed = new EmbedBuilder()
            .setColor(interaction?.color?.red || 'Red')
            .setTitle(`Fehler`)
            .setDescription(`Ein Fehler ist aufgetreten und der Command konnte nicht ordnungsgemäß ausgeführt werden.\nFehler-Code: ${errorId}`)
        await interaction.followUp({ embeds: [embed], ephemeral: true })
    } catch (error) {console.error}

}