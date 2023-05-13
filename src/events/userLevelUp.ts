import Discord from 'discord.js'
import stattranslations from '../battle/stattranslations.json'
import classes from '../battle/classes'
import getcolor from '../subcommands/getcolor'
import delay from 'delay'
import statnames from '../battle/stats'
import { hidden } from '../battle/stats'

export default {
    name: 'Level Up Message',
    event: 'userLevelUp',
    async on(ita: Discord.CommandInteraction | Discord.ButtonInteraction, levelCount: number, client: Discord.Client, followUp?: boolean) {
        const { user, color } = ita
        let buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
        let embed = new Discord.EmbedBuilder()
            .setColor(color?.normal || (await getcolor(ita.guild)).normal)
            .setAuthor({ 
                name: 'Level Up',
                iconURL: client.user.displayAvatarURL({ extension: 'png', forceStatic: false })
            })
            .setDescription(`Herzlichen Glückwunsch!\nDu hast Level ${user.storage.data.level} erreicht!`)
        if(user.storage.data.battle?.ready) {
            var stats: Discord.Collection<Stats, StatOptions & { added?: number }> = user.storage.data.battle.stats
            embed
                .addFields([{name: 'Statuswerte', value: stats.filter((stat, name)=> !hidden[name]).map((skill: any) => `**${skill.name}**: ${skill.value}`).join('\n'), inline: true}])
        }
        let reply
        let replied = !ita.replied
        if(!ita.replied) reply = await ita.reply({ embeds: [embed], ephemeral: true, fetchReply: true })
        else if(followUp) reply = await ita.followUp({ embeds: [embed], ephemeral: true })
        else {
            reply = await ita.editReply({ embeds: [embed], components: [] })
            replied = true
        }
        if(!user.storage.data.battle?.ready) return
        await delay(2000)

        //@ts-ignore
        let playerClass: PlayerClass = classes[user.storage.data.battle.class]
        let priority = user.storage.data.battle.priority

        for (let l = levelCount || 0; l > 1; l--) {
            stats.forEach(function (stat, name) {
                let added = ((playerClass.statIncrement[name] - playerClass.statIncrementDelta[name]) + Math.random() * playerClass.statIncrementDelta[name] * 2) || 0
                stat.increment += added
                added *= 
                    priority === name ? 1.2 : 
                    priority === 'all' ? 1.1 : 1
                stat.added += Math.round(added)
            })
        }

        embed.setDescription(embed.data.description + '\nBitte wähle einen Skill aus, den du erhöhen möchtest.\nNach 2 Minuten wird automatisch ein zufälliger Skill erhöht.')
        embed.setFields([
            {
                name: 'Statuswerte', //@ts-ignore
                value: Object.entries(stats).map(([name, stat]) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)} ${stat.added ? `+ ${stat.added}` : ''}`).join('\n'),
                inline: true
            }
        ]);

        //TODO: Autp heal
        (Object.entries(stats) as [Stats, any]).forEach(([name, stat]) => {
            if(name == 'hp') user.storage.data.battle.hp += stat.added
            stat.added = 0
        })

        buttons.addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('userLevelUp.hp')
                .setLabel('HP')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('userLevelUp.atk')
                .setLabel('Angriff')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('userLevelUp.def')
                .setLabel('Verteidigung')
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('userLevelUp.spd')
                .setLabel('Geschwindigkeit')
                .setStyle(Discord.ButtonStyle.Secondary)
        )

        if(!replied) reply = await reply.edit({ embeds: [embed], components: [buttons] })
        else reply = await ita.editReply({ embeds: [embed], components: [buttons] }) 

        for(let l = levelCount; l > 0; l--) {
            const interaction = await (reply.awaitMessageComponent({ time: 120000 }).catch(() => {}) || ita) as Discord.ButtonInteraction
            
            let sk = interaction.customId.split('.')[1] || statnames[Math.floor(Math.random() * statnames.length)] as Stats
            stats.forEach((stat, name) => {
                if(name != sk) return stat.added = 0
                let added = ((playerClass.statIncrement[name] - playerClass.statIncrementDelta[name]) + Math.random() * playerClass.statIncrementDelta[name] * 2) || 0
                stat.increment += added
                added *= 
                    priority === name ? 1.2 : 
                    priority === 'all' ? 1.1 : 1
                stat.added = Math.round(added)
            })
    
            embed.setFields([
                {
                    name: 'Statuswerte',
                    //@ts-ignore
                    value: stats.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `**${skill.name}**: ${skill.value}`).join('\n'),
                    inline: true
                },
                {
                    name: '​',
                    //@ts-ignore
                    value: stats.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `+ ${skill.added}`.replaceAll(/\+ 0$/g, '​')).join('\n') + '​',
                    inline: true
                }
            ])
            if(l !== 1) {
                //@ts-ignore
                if(!interaction.replied) await interaction.safeUpdate({ embeds: [embed], components: [buttons] })
                else await interaction.editReply({ embeds: [embed], components: [buttons] })
            } else {
                embed.setDescription(`Herzlichen Glückwunsch!\nDu hast Level ${user.storage.data.level} erreicht!`)
                //@ts-ignore
                if(!interaction.replied) await interaction.safeUpdate({ embeds: [embed], components: [] })
                else await interaction.editReply({ embeds: [embed], components: [] })
                await delay(2000)
                await interaction.editReply({ embeds: [embed.spliceFields(1, 1)]})
            }

    
            stats.forEach((skill: any) => {
                if(skill.name == 'HP') user.storage.data.battle.hp += skill.added
                delete skill.added
            })
        }

        await user.save()
    }
}