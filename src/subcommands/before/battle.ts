import Discord from 'discord.js'
import delay from 'delay'
import classes from '../../battle/classes'
import statnames from '../../battle/stats'
import { hidden } from '../../battle/stats'
import calculateVisualStatValue from '../../util/calculateVisualStatValue'
import calculateStatValue from '../../util/calculateStatValue'
import stattranslations from '../../battle/stattranslations.json'

export default async (ita: Discord.CommandInteraction, args: any, client: Discord.Client) => {
    const { user, guild, color } = ita
    if(!user.storage.data.battle?.ready) {

        //Willkommen
        let embed = new Discord.EmbedBuilder()
            .setColor(color.normal)
            .setTitle('Willkommen')
            .setDescription('>>> Herzlich Willkommen beim KeksBot Kampfsystem. (Ich such btw noch einen kuhlen Namen c:)\nBevor du anfangen kannst, Leute zu bonken, musst du aber noch ein paar Sachen machen.')
            .setFooter({text: 'Schritt 1/7'})
        let buttons: any = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step1')
                    .setLabel('Fortfahren')
                    .setStyle(Discord.ButtonStyle.Primary)
            )
        const message = await ita.reply({ embeds: [embed], components: [buttons], fetchReply: true, ephemeral: true })
        let interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
        if(!interaction) return

        //Allgemein
        embed
            .setTitle('Allgemeine Informationen')
            .setDescription('>>> Beim KeksBot Kampfsystem handelt es sich um ein skillbasiertes PvP "Roleplay".\nDurch Level-Ups und Items erhöhen sich Statuswerte und man wird stärker. Relativ simpel :)\n**Wichtiger Hinweis**: Das ganze ist aktuell ein Proof of Concept und dient ausschließlich Entwicklungszwecken. Eine später verwendete Version kann stark vom aktuellen Entwicklungsstatus abweichen. Daher kann es während der Entwicklung regelmäßig zum Zurücksetzen der Spielstände kommen.')
            .setFooter({text: 'Schritt 2/7'})
        buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step2')
                    .setLabel('Fortfahren')
                    .setStyle(Discord.ButtonStyle.Primary)
            )
        await interaction.update({ embeds: [embed], components: [buttons], fetchReply: true })
        interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction 
        if(!interaction) return

        //Klasse

        embed
            .setTitle('Klasse')
            .setDescription('>>> Wähle eine Klasse aus.\nDiese bestimmt, welche Skills du erlernen kannst und welche Statuswerte zu Beginn wie hoch ausfallen.')
            .setFooter({text: 'Schritt 3/7'})
        buttons = [new Discord.ActionRowBuilder<Discord.ButtonBuilder>()]
        classes.forEach(c => {
            if(buttons[buttons.length - 1].components.length >= 5) buttons.push(new Discord.ActionRowBuilder<Discord.ButtonBuilder>())
            buttons[buttons.length - 1].addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId(`battlesetup:step3.${c.id}`)
                    .setLabel(c.translations.de)
                    .setStyle(Discord.ButtonStyle.Secondary)
            )
        })
        await interaction.update({ embeds: [embed], components: buttons, fetchReply: true })
        interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
        if(!interaction) return

        let playerClass = classes.find(c => c.id == interaction.customId.split('.')[1])

        //Stat Priorität
        embed
            .setTitle('Statpriorität')
            .setDescription('>>> Wähle einen priorisierten Statuswert.\nDieser steigt bei Level Ups schneller an, als andere.')
            .setFooter({text: 'Schritt 4/7'})
        buttons = [new Discord.ActionRowBuilder<Discord.ButtonBuilder>(), new Discord.ActionRowBuilder<Discord.ButtonBuilder>()]
        buttons[0].addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.hp')
                .setLabel(stattranslations.hp.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.attack')
                .setLabel(stattranslations.attack.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.defense')
                .setLabel(stattranslations.defense.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.speed')
                .setLabel(stattranslations.speed.de)
                .setStyle(Discord.ButtonStyle.Secondary)
        )
        buttons[1].addComponents(
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.mana')
                .setLabel(stattranslations.mana.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.mAttack')
                .setLabel(stattranslations.mAttack.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.mDefense')
                .setLabel(stattranslations.mDefense.de)
                .setStyle(Discord.ButtonStyle.Secondary),
            new Discord.ButtonBuilder()
                .setCustomId('battlesetup:step4.all')
                .setLabel('Ausgeglichen')
                .setStyle(Discord.ButtonStyle.Secondary)
        )
        await interaction.update({ embeds: [embed], components: buttons, fetchReply: true })
        interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
        if(!interaction) return

        //Stats initialisieren
        let priority = interaction.customId.split('.')[1] 
        let stats: Discord.Collection<Stats, StatOptions & { added?: number }> = new Discord.Collection()
        for (const s of statnames as Stats[]) {
            stats.set(s, {
                base: playerClass.baseStats[s],
                priority: priority == s ? 1.2 : priority == 'all' ? 1.1 : undefined,
                increment: 0,
                randomness: Math.random() * 0.1 + 0.95,
                absModifier: 0,
                relModifier: 1,
                added: 0
            })
        }

        if((user.storage.data.level || 0) > 1) {

            //Autostats
            embed
                .setTitle('Verteilung der Statuswerte')
                .setDescription(`> Du erhältst nun automatisch anhand deines Levels Statuswerte.`)
                .addFields([{name: 'Statuswerte', value: stats.filter((stat, name)=> !hidden[name]).map((stat, name) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)}`).join('\n'), inline: true}])
                .setFooter({text: 'Schritt 5/7'})
            await interaction.update({ embeds: [embed], components: [], fetchReply: true })
            for (let l = user.storage.data.level || 0; l > 1; l--) {
                stats.forEach(function (stat, name) {
                    let added = ((playerClass.statIncrement[name] - playerClass.statIncrementDelta[name]) + Math.random() * playerClass.statIncrementDelta[name] * 2) || 0
                    stat.increment += added
                    added *= 
                        priority === name ? 1.2 : 
                        priority === 'all' ? 1.1 : 1
                    stat.added += Math.round(added)
                })
            }
            await delay(2000)
            embed.setFields([
                {
                    name: 'Statuswerte',
                    value: stats.filter((stat, name)=> !hidden[name]).map((stat, name) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)} ${stat.added ? `+ ${stat.added}` : ''}`).join('\n'),
                    inline: true
                }
            ])
            buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('battlesetup:step5')
                        .setLabel('Fortfahren')
                        .setStyle(Discord.ButtonStyle.Primary)
                );
            [...stats.values()].forEach(stat => {stat.added = 0})

            await interaction.editReply({ embeds: [embed], components: [buttons] })
            interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
            if(!interaction) return

            //Skillpunkte setzen
            buttons = [new Discord.ActionRowBuilder<Discord.ButtonBuilder>(), new Discord.ActionRowBuilder<Discord.ButtonBuilder>()]
            buttons[0].addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.hp')
                    .setLabel(stattranslations.hp.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.attack')
                    .setLabel(stattranslations.attack.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.defense')
                    .setLabel(stattranslations.defense.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.speed')
                    .setLabel(stattranslations.speed.de)
                    .setStyle(Discord.ButtonStyle.Secondary)
            )
            buttons[1].addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.mana')
                    .setLabel(stattranslations.mana.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.mAttack')
                    .setLabel(stattranslations.mAttack.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:step4.mDefense')
                    .setLabel(stattranslations.mDefense.de)
                    .setStyle(Discord.ButtonStyle.Secondary),
            )
            embed.setFooter({text: 'Schritt 6/7'})
            for (let l = user.storage.data.level || 0; l > 1; l--) {
                embed  
                    .setTitle('Verteilung der Statuswerte')
                    .setDescription(`>>> Pro Level kannst du eine zusätzliche Erhöhung eines beliebigen Skills durchführen. (${(l - 1)} verbleibend)`)
                    .setFields([
                        {
                            name: 'Statuswerte',
                            value: stats.filter((stat, name)=> !hidden[name]).map((stat, name) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)} ${stat.added ? `+ ${stat.added}` : ''}`).join('\n'),
                            inline: true
                        }
                    ])
                await interaction.update({ embeds: [embed], components: buttons })    
                interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction 
                if(!interaction) return

                let sk = interaction.customId.split('.')[1]
                stats.forEach((stat, name) => {
                    if(name != sk) return stat.added = 0
                    let added = ((playerClass.statIncrement[name] - playerClass.statIncrementDelta[name]) + Math.random() * playerClass.statIncrementDelta[name] * 2) || 0
                    stat.increment += added
                    added *= 
                        priority === name ? 1.2 : 
                        priority === 'all' ? 1.1 : 1
                    stat.added = Math.round(added)
                })
            }

            embed  
                .setTitle('Verteilung der Statuswerte')
                .setDescription(`>>> Alle verfügbaren Erhöhungen wurden verwendet.`)
                .setFields([
                    {
                        name: 'Statuswerte',
                        value: stats.filter((stat, name)=> !hidden[name]).map((stat, name) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)} ${stat.added ? `+ ${stat.added}` : ''}`).join('\n'),
                        inline: true
                    }
                ])
            stats.forEach(skill => { delete skill.added })
            buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('battlesetup:step5')
                        .setLabel('Fortfahren')
                        .setStyle(Discord.ButtonStyle.Primary)
                )
            await interaction.update({ embeds: [embed], components: [buttons] })
            interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
            if(!interaction) return
        } else {
            //Kein-Level-Fehler
            embed = new Discord.EmbedBuilder()
                .setTitle('Verteilung der Statuswerte')
                .setDescription(`>>> Du hast bisher noch kein Level erreicht.\nVerwende \`/cookies\` und \`/eat\`, um dein Level zu erhöhen und deine Statuswerte zu verbessern.`)
                .setFooter({text: 'Schritt 5+6/7'})
                .setColor(color.red)
            buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
                .addComponents(
                    new Discord.ButtonBuilder()
                        .setCustomId('battlesetup:step56')
                        .setLabel('Fortfahren')
                        .setStyle(Discord.ButtonStyle.Primary)
                )
            await interaction.update({ embeds: [embed], components: [buttons] })
            interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
            if(!interaction) return    
        }

        //Anzeige
        embed
            .setTitle('Registrierung abschließen')
            .setDescription('Bitte überprüfe die Werte und schließe die Vorbereitung ab.')
            .setFields(
                [ 
                    { name: 'Klasse', value: playerClass.translations.de, inline: true },
                    { name: 'Priorität', value: stattranslations[priority as Stats]?.de || 'Ausgeglichen', inline: true },
                    { name: 'Statuswerte', value: stats.filter((stat, name)=> !hidden[name]).map((stat, name) => `**${stattranslations[name].de}**: ${calculateVisualStatValue(name, stat)}`).join('\n') },
                ]
            )
            .setFooter({text: 'Schritt 7/7'})
        buttons = new Discord.ActionRowBuilder<Discord.ButtonBuilder>()
            .addComponents(
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:saveandexit')
                    .setLabel('Speichern und verlassen')
                    .setStyle(Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:save')
                    .setLabel('Speichern und Fortfahren')
                    .setStyle(Discord.ButtonStyle.Success),
                new Discord.ButtonBuilder()
                    .setCustomId('battlesetup:exit')
                    .setLabel('Abbrechen')
                    .setStyle(Discord.ButtonStyle.Danger)
            )
        await interaction.update({ embeds: [embed], components: [buttons] })
        interaction = await message.awaitMessageComponent({ time: 300000 }).catch(() => null) as Discord.ButtonInteraction
        if(!interaction) return
        if(interaction.customId.split(':')[1].startsWith('save')) {
            user.storage.data.battle = {
                id: user.id,
                priority,
                stats: stats as UserData['battle']['stats'],
                ready: true,
                attacks: ['angriff'],
                hp: calculateStatValue(stats.get('hp')),
                healTimestamp: Date.now(),
                class: playerClass.id
            }
            user.storage.inventory.addItem({
                id: 'potion_t1',
                uniqueId: 'potion_t1',
                count: 5,
            })
            await user.save()
            // TODO: Add 5 potion_t1 to inventory as seen below
            // await user.setData({ battle, inventory: [{ id: 'potion_t1', count: 5 }] })
        }
        switch(interaction.customId.split(':')[1]) {
            case 'saveandexit':
                embed
                    .setTitle('Daten gespeichert')
                    .setDescription('Alle erforderlichen Daten wurden angelegt.')
                    .setFooter(null)
                    .setFields([])
                    .setColor(color.lime)
                await interaction.update({ embeds: [embed], components:     [] })
                return false
            case 'save':
                embed
                    .setTitle('Daten gespeichert')
                    .setDescription('Alle erforderlichen Daten wurden angelegt. Der Prozess wird nun fortgesetzt.')
                    .setFooter(null)
                    .setFields([])
                    .setColor(color.lime)
                await interaction.update({ embeds: [embed], components: [] })
                await delay(3000)
                return true
            case 'exit':
                embed
                    .setTitle('Abbruch')
                    .setDescription('Der Prozess wurde abgebrochen.')
                    .setFooter({text: 'Alle angelegten Daten wurden vernichtet.'})
                    .setFields([])
                    .setColor(color.red)
                await interaction.update({ embeds: [embed], components: [] })
                return false
        }
    }
}