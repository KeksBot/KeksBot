import Discord, { Guild } from 'discord.js'
import emotes from '../../emotes.json'

const options: CommandOptions = {
    name: 'serverinfo',
    description: 'Zeigt Informationen zu diesem Server an.',
    async execute(ita, args, client) {
        var { guild, color, member } = ita

        let cookielimit = 2 ** (guild.data.level || 1 + 8)
        if (guild.data?.partner == 1 && cookielimit < 65536) cookielimit = 65536
        if (guild.data?.verified && cookielimit < 4194304) cookielimit = 4194304


        let embeds: { expand?: Discord.EmbedBuilder, collapse?: Discord.EmbedBuilder } = {
            expand: new Discord.EmbedBuilder()
                .setColor(color.normal)
                .setTitle(guild.name)
                .setThumbnail(guild.iconURL({ forceStatic: false, size: 512, extension: 'png' }))
                .addFields([
                    { name: 'Erfahrungspunkte', value: guild.data?.xp?.toString() || '0', inline: true },
                    { name: 'Level', value: guild.data?.level?.toString() || '1', inline: true },
                    { name: 'Kekslimit', value: (cookielimit.toString() || '512') + ' Kekse pro Minute', inline: true }
                ])
        }
        embeds.collapse = new Discord.EmbedBuilder({ ...embeds.expand.toJSON() })

        let buttons = {
            expand: new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .setComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji(emotes.expand)
                        .setCustomId('serverinfo:expand')
                        .setStyle(Discord.ButtonStyle.Secondary)
                ),
            collapse: new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .setComponents(
                    new Discord.ButtonBuilder()
                        .setEmoji(emotes.collapse)
                        .setCustomId('serverinfo:collapse')
                        .setStyle(Discord.ButtonStyle.Secondary)
                )
        }

        let message = await ita.reply({ embeds: [embeds.expand], components: [buttons.expand], ephemeral: true, fetchReply: true })
        const filter = (ita: any) => ita.customId.startsWith('serverinfo:')
        const collector = message.createMessageComponentCollector({ filter, time: 900000, componentType: Discord.ComponentType.Button })

        collector.on('collect', async (ita) => {
            if (embeds.expand == embeds.collapse) {
                embeds.collapse.addFields([
                    { name: 'ID', value: guild.id, inline: true },
                    { name: 'Erstellt am', value: `<t:${Math.floor(guild.createdAt.getTime() / 1000)}>\n<t:${Math.floor(guild.createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: 'Owner', value: `<@!${guild.ownerId}>`, inline: true },
                    {
                        name: 'Mitglieder', value:
                            'Gesamt: ' + guild.memberCount + '\n' +
                            'Nutzer: ' + (await guild.members.fetch()).filter(m => !m.user.bot).size.toString() + '\n' +
                            'Bots: ' + (await guild.members.fetch()).filter(m => m.user.bot).size.toString(),
                        inline: true
                    },
                    {
                        name: 'Verifizierungsstufe', value: (function () {
                            switch (guild.verificationLevel) {
                                case Discord.GuildVerificationLevel.None: return '⚪ Keine'
                                case Discord.GuildVerificationLevel.Low: return '🟢 Niedrig'
                                case Discord.GuildVerificationLevel.Medium: return '🟡 Mittel'
                                case Discord.GuildVerificationLevel.High: return '🟠 Hoch'
                                case Discord.GuildVerificationLevel.VeryHigh: return '🔴 Höchste'
                                default: return '⚫ Unbekannt'
                            }
                        })(), inline: true
                    }
                ])

                if (guild.premiumSubscriptionCount) embeds.collapse.addFields([{
                    name: 'Server Boost',
                    value: `Level: ${(function () {
                        switch (guild.premiumTier) {
                            case Discord.GuildPremiumTier.None: return 0
                            case Discord.GuildPremiumTier.Tier1: return 1
                            case Discord.GuildPremiumTier.Tier2: return 2
                            case Discord.GuildPremiumTier.Tier3: return 3
                            default: return 'Unbekannt'
                        }
                    })()}\nBoosts: ${guild.premiumSubscriptionCount}/${(function() {
                        switch (guild.premiumTier) {
                            case Discord.GuildPremiumTier.None: return 2
                            case Discord.GuildPremiumTier.Tier1: return 14
                            default: return 30
                        }
                    })()}`,
                    inline: true
                }])
            }
            
            let type = ita.customId.split(':')[1]
            //@ts-ignore
            await message.edit({ embeds: [embeds[type]], components: [buttons[type]] })
        })
    }
}