import Discord from 'discord.js'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'userinfo',
    description: 'Zeigt Informationen zu einem bestimmten Nutzer an',
    options: [
        {
            name: 'user',
            description: 'Anzuzeigender Nutzer',
            type: Discord.ApplicationCommandOptionType.User,
            required: true
        }
    ],
    async execute(ita, args, client) {
        var { color, guild, member } = ita
        //@ts-ignore
        let targetMember: Discord.GuildMember = args.user == ita.user.id ? member : await guild.members.fetch(args.user).catch(() => null)
        if (!targetMember) return ita.error('Fehler', 'Der Nutzer konnte nicht gefunden werden.', true)
        targetMember.data = await targetMember.user.getData()
        if (!targetMember.data) targetMember.data = { id: targetMember.id }

        let embeds: { expand?: Discord.EmbedBuilder, collapse?: Discord.EmbedBuilder } = {}

        let baseEmbedFields: Array<Discord.APIEmbedField> = [
            { name: 'Lagerstand', value: targetMember.data?.cookies?.toString() || '0', inline: true },
            { name: 'Erfahrungspunkte', value: targetMember.data?.xp?.toString() || '0', inline: true },
            { name: 'Level', value: targetMember.data?.level?.toString() ||'1', inline: true }
        ]
        
        let badges: String[] = []
        // if (targetMember.data.badges) {
        //     if (targetMember.data.badges.mod) badges.push(emotes.mod)
        //     if (targetMember.data.badges.dev) badges.push(emotes.dev)
        //     if (targetMember.data.badges.team) badges.push(emotes.team)
        //     if (targetMember.data.badges.verified) badges.push(emotes.verified)
        //     if (targetMember.data.badges.partner) badges.push(emotes.partner)
        //     if (targetMember.data.badges.beta) badges.push(emotes.firsthour)
        // }

        embeds.expand = new Discord.EmbedBuilder()
            .setColor(color.normal)
            .setTitle(targetMember.displayName)
            .setThumbnail(targetMember.user.displayAvatarURL({ forceStatic: false, size: 512, extension: 'png' }))
            .setDescription('<@!' + targetMember.id + '>\n' + badges.join(' '))
            .addFields(baseEmbedFields)

        embeds.collapse = new Discord.EmbedBuilder({ ...embeds.expand.toJSON() })

        let buttons = {
            expand: new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .setComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji(emotes.expand)
                        .setCustomId('userinfo:collapse')
                        .setStyle(Discord.ButtonStyle.Secondary)
                ),
            collapse: new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .setComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji(emotes.collapse)
                        .setCustomId('userinfo:expand')
                        .setStyle(Discord.ButtonStyle.Secondary)
                )
        }

        let message = await ita.reply({ embeds: [embeds.expand], components: [buttons.expand], ephemeral: true, fetchReply: true })
        const filter = (ita: any) => ita.customId.startsWith('userinfo:')
        const collector = message.createMessageComponentCollector({ filter, time: 900000, componentType: Discord.ComponentType.Button })

        collector.on('collect', async (ita) => {
            if (collector.collected.size == 1) {
                let roles = targetMember.roles.cache.array()
                roles.sort((a, b) => {
                    return a.comparePositionTo(b) * -1
                })
                //@ts-ignore
                roles = roles.map(r => `<@&${r.id}>`)
                embeds.collapse
                    .addFields([
                        {
                            name: 'ID',
                            value: targetMember.id,
                            inline: true
                        },
                        {
                            name: 'Serverbeitritt',
                            value: `<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}>\n<t:${Math.floor(targetMember.joinedAt.getTime() / 1000)}:R>`,
                            inline: true
                        },
                        {
                            name: 'Account erstellt',
                            value: `<t:${Math.floor(targetMember.user.createdAt.getTime() / 1000)}>\n<t:${Math.floor(targetMember.user.createdAt.getTime() / 1000)}:R>`,
                            inline: true
                        },
                        {
                            name: 'Rollen',
                            value: roles.join(' ')
                        }
                    ])
            }

            let type = ita.customId.split(':')[1]
            //@ts-ignore
            await ita.update({ embeds: [embeds[type]], components: [buttons[type]] })
        })
    }
}

export default options