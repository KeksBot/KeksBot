import Discord from 'discord.js'
import skillid from '../battle/skillids.json'
import skillinformation from '../battle/skills.json'
import getcolor from '../subcommands/getcolor'
import delay from 'delay'

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
        if(user.storage.data.battle.ready) {
            var { skills } = user.storage.data.battle
            embed
                //@ts-ignore
                .addFields([{name: 'Statuswerte', value: skills.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `**${skill.name}**: ${skill.value}`).join('\n'), inline: true}])
                .setDescription(embed.data.description)
        }
        let reply
        let replied = !ita.replied
        if(!ita.replied) reply = await ita.reply({ embeds: [embed], ephemeral: true, fetchReply: true })
        else if(followUp) reply = await ita.followUp({ embeds: [embed], ephemeral: true })
        else {
            reply = await ita.editReply({ embeds: [embed], components: [] })
            replied = true
        }
        if(!user.storage.data.battle.ready) return
        await delay(2000)

        skills = user.storage.data.battle.skills

        for (let l = levelCount || 0; l > 0; l--) {
            //@ts-ignore
            skills.forEach((skill: any) => {
                //@ts-ignore
                let added = (skillinformation[skill.name].avgChange - skillinformation[skill.name].diffChange) + Math.random() * skillinformation[skill.name].diffChange * 2
                added *= 
                    user.storage.data.battle.priority === skill.name ? 1.5 : 
                    user.storage.data.battle.priority === 'Ausgeglichen' ? 1.125 : 1
                added = Math.round(added)
                // @ts-ignore
                skill.added = added
            })
        }

        embed.setDescription(embed.data.description + '\nBitte wähle einen Skill aus, den du erhöhen möchtest.\nNach 2 Minuten wird automatisch ein zufälliger Skill erhöht.')
        embed.setFields([
            {
                name: 'Statuswerte',
                //@ts-ignore
                value: skills.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `**${skill.name}**: ${skill.value + skill.added}`).join('\n') + '​',
                inline: true
            },
            {
                name: '​',
                //@ts-ignore
                value: skills.filter(s => !skillinformation[s.name].hidden).map((s: any) => `+ ${s.added}`.replaceAll(/\+ 0$/g, '​')).join('\n') + '​',
                inline: true
            }
        ])

        skills.forEach((skill: any) => {
            skill.value += skill.added
            if(skill.name == 'HP') user.storage.data.battle.hp += skill.added
            skill.added = 0
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
            const interaction = await (reply.awaitMessageComponent({ time: 120000 }).catch(() => {}) || ita) as Discord.ButtonInteraction | Discord.SelectMenuInteraction | Discord.CommandInteraction
            //@ts-ignore
            const sk = skillid[interaction?.customId?.split('.')[1]] || Object.values(skillid)[Math.floor(Math.random() * Object.values(skillid).length)]
    
            skills.forEach((skill: any) => {
                if(skill.name != sk) return skill.added = 0
                //@ts-ignore
                let added = ((skillinformation[skill.name].avgChange - skillinformation[skill.name].diffChange) + Math.random() * skillinformation[skill.name].diffChange * 2)
                added *= 
                    user.storage.data.battle.priority === skill.name ? 1.5 : 
                    user.storage.data.battle.priority === 'Ausgeglichen' ? 1.125 : 1
                added = Math.round(added / 2)
                skill.added = added
                skill.value += skill.added
            })
    
            embed.setFields([
                {
                    name: 'Statuswerte',
                    //@ts-ignore
                    value: skills.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `**${skill.name}**: ${skill.value}`).join('\n'),
                    inline: true
                },
                {
                    name: '​',
                    //@ts-ignore
                    value: skills.filter(s => !skillinformation[s.name].hidden).map((skill: any) => `+ ${skill.added}`.replaceAll(/\+ 0$/g, '​')).join('\n') + '​',
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

    
            skills.forEach((skill: any) => {
                if(skill.name == 'HP') user.storage.data.battle.hp += skill.added
                delete skill.added
            })
        }

        await user.save()
    }
}