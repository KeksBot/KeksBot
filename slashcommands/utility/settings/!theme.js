const discord = require('discord.js')
const delay = require('delay')
const update = require('../../../db/update')

module.exports = async function(ita, args, client) {
    var { guild, color } = ita
    if(args.color) {
        var execute = false
        let embed = new discord.MessageEmbed()
            .setTitle('Farbeinstellungen | Standardfarbe')
            .setDescription('Möchtest du die jetzt angezeigte Farbe als Standard festlegen?')
        try {
            if(args.color.toLowerCase() == 'role') embed.setColor(guild.me.displayColor)
            else embed.setColor(args.color.toUpperCase())
            execute = true
        } catch {
            embed = new discord.MessageEmbed()
                .setTitle('Fehler')
                .setColor(color.red)
                .setDescription(`\`${args.color}\` ist keine akzeptierte Farbe.\nBitte gib einen HEX-Farbcode oder eine auf [dieser](https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable) Liste aufgeführte Farbe ein.`)
            await ita.reply({ embeds: [embed], ephemeral: true })
        }
        if(execute) {
            let buttons = new discord.MessageActionRow()
                .addComponents([
                    new discord.MessageButton()
                        .setCustomId('settings:theme:yes')
                        .setStyle('SUCCESS')
                        .setLabel('Ja'),
                    new discord.MessageButton()
                        .setCustomId('settings:theme:no')
                        .setStyle('DANGER')
                        .setLabel('Nein')
                ])
            let message = await ita.reply({ embeds: [embed], ephemeral: true, components: [buttons], fetchReply: true })
            let i = await message.awaitMessageComponent({ componentType: 'BUTTON', time: 600_000, })
            if(!i) return
            let textcontinue = ''
            if(args.theme) textcontinue = '\nDie Einstellungen für das Theme werden in Kürze geladen.'
            if(i.customId.includes('yes')) {
                color.normal = args.color.toUpperCase()
                if(!guild.data.theme) guild.data.theme = {}
                if(args.color.toLowerCase() == 'role') guild.data.theme.normal = 'role'
                else guild.data.theme.normal = args.color.toUpperCase()
                await update('serverdata', guild.id, { theme: guild.data.theme })
                embed = new discord.MessageEmbed()
                    .setColor(color.lime)
                    .setTitle('Änderungen übernommen')
                    .setDescription('Die Standardfarbe wurde erfolgreich geändert.' + textcontinue)
                await i.update({ embeds: [embed], components: [] })
            } else {
                embed = new discord.MessageEmbed()
                    .setColor(color.lime)
                    .setTitle('Änderungen verworfen')
                    .setDescription('Der Vorgang wurde erfolgreich abgebrochen.' + textcontinue)
                await i.update({ embeds: [embed], components: [] })
            }
        }
        if(args.theme) await delay(2500)
        else return
    }
    if(args.theme) {
        let themetext
        switch(args.theme) {
            case 'default':
                Object.assign(guild.data.theme || {}, { red: '0xE62535', yellow: '0xF2E03F', lime: '0x25D971' })
                themetext = 'Du hast das KeksBot Standard Theme ausgewählt.\nEs erwartet dich höchste Qualität mit viel Kontrast'
                break
            case 'dark': 
                Object.assign(guild.data.theme || {}, { red: '0x661017', yellow: '0x736A1E', lime: '0x0F592E' })
                themetext = 'Du hast das KeksBot Dark Theme ausgewählt.\nDie richtige Auswahl für die 3 Leute, die Discord als Taschenlampe hernehmen und mehr Kontrast zwischen Hintergrund und Embed wollen'
                break
            case 'old':
                Object.assign(guild.data.theme || {}, { red: '0xFF0000', yellow: '0xF1C40F', lime: '0x2ECC71' })
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
    if(ita.replied) return
    let embed = new discord.MessageEmbed()
        .setTitle('Farbeinstellungen')
        .setDescription('Benutze `/settings theme color:<Farbe>`, um die Standardfarbe für Embeds (sieht man bei dieser Nachricht; `Farbe` kann hierbei ein HEX-Farbcode oder ein Text sein), \
und `/settings theme theme:<Auswahl>`, um die Farben für andere Embeds zu verändern (`Auswahl` ist eines von vordefinierten Themes)')
        .setColor(color.normal)
        .addField('Standardfarbe', (function() {
            let out = color.normal.toString('16')
            while(out.length < 6) out = '0' + out
            return ('#' + out).toUpperCase()
        })(), true)
        .addField('Theme', (function() {
            if(guild.data.theme?.red) {
                let out = 'Bezeichnung: '
                switch (guild.data.theme.red) {
                    case '0xE62535': out += 'KeksBot Standard'; break
                    case '0x661017': out += 'KeksBot Dark'; break
                    case '0xFF0000': out += 'KeksBot Origins'; break
                    case '0xED4245': out += 'Discord'; break
                    case '0x303030': out += 'Graustufen'; break
                    default: 'Unbekannt'
                }
                out += `\nRot: ${guild.data.theme.red}`
                out += `\nGelb: ${guild.data.theme.yellow}`
                out += `\nGrün: ${guild.data.theme.lime}`
                return out.replaceAll('0x', '#').replaceAll('undefined', 'Unbekannt').replaceAll('null', 'Unbekannt')
            } else return 'Bezeichnung: KeksBot Standard\nRot: `#E62535`\nGelb: `#F2E03F`\nGrün: `#25D971`'
        })(), true)
    ita.reply({ embeds: [embed], ephemeral: true })
}