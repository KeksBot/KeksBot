const discord = require('discord.js')
const update = require('../../../db/update')

module.exports = async function(ita, args, client) {
    var { guild, color } = ita
    if(args.color) {

    }
    if(args.theme) {
        let themetext
        switch(args.theme) {
            case 'default':
                Object.assign(guild.data.theme || {}, { red: '0xe62535', yellow: '0xf2e03f', lime: '0x25d971' })
                themetext = 'Du hast das KeksBot Standard Theme ausgewählt.\nEs erwartet dich höchste Qualität mit viel Kontrast'
                break
            case 'dark': 
                Object.assign(guild.data.theme || {}, { red: '0x661017', yellow: '0x736a1e', lime: '0x0f592e' })
                themetext = 'Du hast das KeksBot Dark Theme ausgewählt.\nDie richtige Auswahl für die 3 Leute, die Discord als Taschenlampe hernehmen und mehr Kontrast zwischen Hintergrund und Embed wollen'
                break
            case 'old':
                Object.assign(guild.data.theme || {}, { red: '0xff0000', yellow: '0xf1c40f', lime: '0x2ecc71' })
                themetext = 'Du hast das KeksBot Origins Theme ausgewählt.\nDie richtigen Farben für OGs! Genieß die alten KeksBot Farben ganz ohne Staubschichten mit ihrem ursprünglichen Glanz'
                break
            case 'discord':
                Object.assign(guild.data.theme || {}, { red: '0xED4245', yellow: '0xFEE75C', lime: '0x57F287' })
                themetext = 'Du hast das Discord Theme ausgewählt.\nFreue dich auf die [Discord Farben](https://discord.com/branding) jetzt auch im KeksBot!\n__Protipp:__ Verwende `/settings theme color:blurple`, um das Design zu perfektionieren'
                break
            case 'gray':
                Object.assign(guild.data.theme || {}, { red: '0x303030', yellow: '0x6B6B6B', lime: '0xAFAFAF' })
                themetext = 'Du hast Graustufen ausgewählt.\nEmbeds sind jetzt grau o.O'
                break
        }
        themetext += '\n\nDu bist aktuell im Vorschau-Modus. \nBenutze die Knöpfe unten, um die einzelnen Farben in Aktion zu sehen.\nWenn du fertig bist, drücke auf "Speichern" oder "Abbrechen"'
        let embed = new discord.MessageEmbed()
            .setColor(color.normal)
            .setTitle('Farbeinstellungen | Theme')
            .setDescription(themetext)
        let buttons = new discord.MessageActionRow()
            .addComponents([
                new discord.MessageButton()
                    .setCustomId('settings:theme:save')
                    .setStyle('SUCCESS')
                    .setLabel('Speichern'),
                new discord.MessageButton()
                    .setCustomId('settings:theme:cancel')
                    .setStyle('DANGER')
                    .setLabel('Abbrechen'),
                new discord.MessageButton()
                    .setCustomId('settings:theme:lime')
                    .setStyle('SECONDARY')
                    .setLabel('Grün'),
                new discord.MessageButton()
                    .setCustomId('settings:theme:yellow')
                    .setStyle('SECONDARY')
                    .setLabel('Gelb'),
                new discord.MessageButton()
                    .setCustomId('settings:theme:red')
                    .setStyle('SECONDARY')
                    .setLabel('Rot')
            ])
        if(ita.replied) message = await ita.editReply({ embeds: [embed], components: [buttons], fetchReply: true })
        else message = await ita.reply({ embeds: [embed], components: [buttons], ephemeral: true, fetchReply: true })
        const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 600_000 })
        let theme =  guild.data.theme
        collector.on('collect', async function(i) {
            switch(i.customId.replace('settings:theme:', '')) {
                case 'save':
                    await update('serverdata', guild.id, { theme })
                    embed = new discord.MessageEmbed()
                        .setColor(theme.lime)
                        .setTitle('Änderungen übernommen')
                        .setDescription('Das Theme wurde erfolgreich geändert.')
                    await i.update({ embeds: [embed], components: [] })
                    return collector.stop('1')
                case 'cancel':
                    embed = new discord.MessageEmbed()
                        .setColor(color.red)
                        .setTitle('Änderungen verworfen')
                        .setDescription('Der Vorgang wurde erfolgreich abgebrochen.')
                    await i.update({ embeds: [embed], components: [] })
                    return collector.stop('2')
                case 'lime':
                    embed
                        .setColor(theme.lime)
                        .setTitle('Farbeinstellungen | Theme\nAktuelle Farbe: Grün')
                    await i.update({ embeds: [embed] })
                    return
                case 'yellow':
                    embed
                        .setColor(theme.yellow)
                        .setTitle('Farbeinstellungen | Theme\nAktuelle Farbe: Gelb')
                    await i.update({ embeds: [embed] })
                    return
                case 'red':
                    embed
                        .setColor(theme.red)
                        .setTitle('Farbeinstellungen | Theme\nAktuelle Farbe: Rot')
                    await i.update({ embeds: [embed] })
                    return
            }
        })
    }
}