const discord = require('discord.js')

module.exports = {
    name: 'Level Up Message',
    event: 'userLevelUp',
    async on(ita, levelCount, client) {
        const { user, color } = ita
        let buttons = new discord.MessageActionRow()
        let embed = new discord.MessageEmbed()
            .setColor(await (await require('../subcommands/getcolor')(ita.guild).normal))
            .setAuthor({ 
                name: 'Level Up',
                iconURL: client.user.displayAvatarURL({ format: 'png', dynamic: true })
            })
            .setDescription(`Herzlichen Glückwunsch!\nDu hast Level ${user.data.level} erreicht! <a:yay:730426295397384252>`)
        if(user.data.battle?.ready) {
            let { skills } = user.data.battle
            embed
                .addField('Statuswerte', skills.map(skill => `**${skill.name}**: ${skill.value}`).join('\n'), true)
                .setDescription(embed.description)
        }
        if(ita.isButton()) await ita.safeUpdate({ embeds: [embed], ephemeral: true })
        else await ita.safeReply({ embeds: [embed], ephemeral: true })
        if(!user.data.battle?.ready) return
        await require('delay')(2000)

        const skillid = require('../battledata/skillids.json')
        const skillinformation = require('../battledata/skills.json')
        skills = user.data.battle.skills

        for (let l = levelCount || 0; l > 0; l--) {
            skills.forEach((skill) => {
                let added = ((skillinformation[skill.name].avgChange - skillinformation[skill.name].diffChange) + Math.random() * skillinformation[skill.name].diffChange * 2)
                added *= 
                    user.data.battle.priority === skill.name ? 1.5 : 
                    user.data.battle.priority === 'Ausgeglichen' ? 1.125 : 1
                added = Math.round(added)
                skill.added += added
            })
        }

        embed.setDescription(embed.description + '\nBitte wähle einen Skill aus, den du erhöhen möchtest.\nNach 2 Minuten wird automatisch ein zufälliger Skill erhöht.')
        embed.addField('​', skills.map(s => `+ ${s.added}`.replaceAll(/\+ 0$/g, '​')).join('\n') + '​', true)
        embed.setFields([
            {
                name: 'Statuswerte',
                value: skills.map(skill => `**${skill.name}**: ${skill.value + skill.added}`).join('\n') + '​',
                inline: true
            },
            embed.fields[1]
        ])

        skills.forEach(skill => {
            skill.value += skill.added
            if(skill.name == 'HP') user.data.battle.currentHP += skill.added
            skill.added = 0
        })

        buttons.addComponents(
            new discord.MessageButton()
                .setCustomId('userLevelUp.hp')
                .setLabel('HP')
                .setStyle('SECONDARY'),
            new discord.MessageButton()
                .setCustomId('userLevelUp.atk')
                .setLabel('Angriff')
                .setStyle('SECONDARY'),
            new discord.MessageButton()
                .setCustomId('userLevelUp.def')
                .setLabel('Verteidigung')
                .setStyle('SECONDARY'),
            new discord.MessageButton()
                .setCustomId('userLevelUp.spd')
                .setLabel('Geschwindigkeit')
                .setStyle('SECONDARY')
        )

        const message = await ita.editReply({ embeds: [embed], components: [buttons], fetchReply: true })

        for(let l = levelCount; l > 0; l--) {
            const interaction = await message.awaitMessageComponent({ time: 120000 }).catch(() => {}) || ita
            const sk = skillid[interaction?.customId?.split('.')[1]] || Object.values(skillid)[Math.floor(Math.random() * Object.values(skillid).length)]
            user.data.battle.priority
    
            skills.forEach((skill) => {
                if(skill.name != sk) return skill.added = 0
                let added = ((skillinformation[skill.name].avgChange - skillinformation[skill.name].diffChange) + Math.random() * skillinformation[skill.name].diffChange * 2)
                added *= 
                    user.data.battle.priority === skill.name ? 1.5 : 
                    user.data.battle.priority === 'Ausgeglichen' ? 1.125 : 1
                added = Math.round(added / 2)
                skill.added = added
                skill.value += skill.added
            })
    
            embed.setFields([
                {
                    name: 'Statuswerte',
                    value: skills.map(skill => `**${skill.name}**: ${skill.value + skill.added}`).join('\n'),
                    inline: true
                },
                {
                    name: '​',
                    value: skills.map(skill => `+ ${skill.added}`.replaceAll(/\+ 0$/g, '​')).join('\n') + '​',
                    inline: true
                }
            ])
            if(l !== 1) {
                if(!interaction.replied) await interaction.update({ embeds: [embed], components: [buttons] })
                else await interaction.editReply({ embeds: [embed], components: [buttons] })
            } else {
                embed.setDescription(`Herzlichen Glückwunsch!\nDu hast Level ${user.data.level} erreicht! <a:yay:730426295397384252>`)
                if(!interaction.replied) await interaction.update({ embeds: [embed], components: [] })
                else await interaction.editReply({ embeds: [embed], components: [] })
                await require('delay')(2000)
                await interaction.editReply({ embeds: [embed.spliceFields(1, 1)]})
            }

    
            skills.forEach(skill => {
                if(skill.name == 'HP') user.data.battle.currentHP += skill.added
                skill.added = 0
            })
        }

        await user.setData({ battle: user.data.battle })
    }
}