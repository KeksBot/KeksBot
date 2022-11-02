import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, EmbedBuilder, SelectMenuBuilder, SelectMenuInteraction } from "discord.js"
import objectLoader from "../../../objectLoader"
import { maxSkillAmount } from "../../../../config.json"

const obj: BattleActionBuilder = {
    id: 'scroll',
    name: 'Schriftrolle',
    description: 'Eine geheimnisvolle Schriftrolle, die Informationen zu einer Attacke enthält',
    type: 'item/item',
    inventoryUsable: true,
    purchasable: true,
    async onInvUse(item, user, interaction: ButtonInteraction | SelectMenuInteraction) {
        const { color } = interaction
        if(!user || !interaction || !item) return false
        if(!item.metadata?.skill) return false
        const skill: BattleActionBuilder = objectLoader([item.metadata.skill]).get(item.metadata.skill) 
        if(!skill) return false
        if(user.data.battle.attacks.includes(skill.id)) return [false, 'Du hast diese Attacke bereits gelernt'] 
        let embed = new EmbedBuilder()
            .setDescription('Möchtest du den Skill **' + skill.name + '** lernen?')
            .addFields([
                {
                    name: skill.name,
                    value: skill.description || 'Keine Beschreibung verfügbar',
                    inline: true
                },
                {
                    name: 'Stärke',
                    value: skill.strength.toString(),
                    inline: true
                },
                {
                    name: 'Genauigkeit',
                    value: skill.accuracy.toString(),
                    inline: true
                }
            ])
            .setColor(color.normal)
        let buttons = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('scroll:learn')
                    .setLabel('Erlernen')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('scroll:cancel')
                    .setLabel('Abbrechen')
                    .setStyle(ButtonStyle.Danger)
            )

        let reply = await interaction.update({ embeds: [embed], components: [buttons], fetchReply: true })
        interaction = await reply.awaitMessageComponent({ time: 300000, componentType: ComponentType.Button }).catch((e) => { console.error(e); return null })
        if(!interaction) return false

        if(interaction.customId != 'scroll:learn') return null

        let skills = objectLoader(user.data.battle.attacks)
        if(user.data.battle.attacks.length > maxSkillAmount) {
            let embed = new EmbedBuilder()
                .setColor(color.yellow)
                .setTitle('Zu viele Skills')
                .setDescription('Du kannst nicht mehr als ' + maxSkillAmount + ' Skills erlernen. Bitte wähle einen deiner aktuellen Angriffe aus, den du durch ' + skill.name + ' ersetzen möchtest')
                .addFields([
                    {
                        name: skill.name,
                        value: `${skill.description || 'Keine Beschreibung verfügbar'}\n**Stärke**: ${skill.strength || '-'}\n**Genauigkeit**: ${skill.accuracy.toString().replace('Infinity', '-')}`
                    }
                ])
            user.data.battle.attacks.forEach((s) => {
                let skill = skills.get(s)
                embed.addFields([{ name: skill.name, value: `${skill.description}\n**Stärke**: ${skill.strength || '-'}\n**Genauigkeit**: ${skill.accuracy.toString().replace('Infinity', '-')}`, inline: true }])
            })
            let choices = new ActionRowBuilder<SelectMenuBuilder>()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId('scroll:select')
                        .setPlaceholder('Wähle den Skill aus, den du vergessen mächtest')
                        .addOptions(user.data.battle.attacks.map((s) => {
                            let skill = skills.get(s)
                            return {
                                label: skill.name,
                                value: skill.id,
                            }
                        }))
                        .setMaxValues(1)
                )
            reply = await interaction.update({ embeds: [embed], components: [choices], fetchReply: true })
            interaction = (await reply.awaitMessageComponent({ time: 300000, componentType: ComponentType.SelectMenu }).catch(() => null) || interaction) as SelectMenuInteraction
            if(!interaction) return
            let selected: BattleActionBuilder = skills.get(interaction.values[0])
            embed = new EmbedBuilder()
                .setColor(color.yellow)
                .setTitle('Skill vergessen')
                .setDescription('Möchtest du **' + selected.name + '** wirklich vergessen?')
                .addFields([
                    {
                        name: selected.name,
                        value: `${selected.description || 'Keine Beschreibung verfügbar'}\n**Stärke**: ${selected.strength || '-'}\n**Genauigkeit**: ${selected.accuracy.toString().replace('Infinity', '-')}`
                    }
                ])
            let buttons = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('scroll:forget')
                        .setLabel('Vergessen')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId('scroll:cancel')
                        .setLabel('Abbrechen')
                        .setStyle(ButtonStyle.Success)
                )
            //@ts-ignore
            reply = await interaction.editReply({ embeds: [embed], components: [buttons] })
            interaction = await reply.awaitMessageComponent({ time: 300000, componentType: ComponentType.Button }).catch(() => null) || interaction
            if(interaction?.customId != 'scroll:forget') return null
            user.data.battle.attacks.splice(user.data.battle.attacks.indexOf(selected.id), 1, skill.id)
        } else user.data.battle.attacks.push(skill.id)
        await user.save()
        interaction.deferUpdate()
        return 'Du hast den Skill ' + skill.name + ' erlernt'
    },
    async onLoad() {
        if(this.metadata?.name) this.name = this.metadata.name
        if(this.metadata?.description) this.description = this.metadata.description
        if(this.metadata?.prefix) this.name = this.metadata.prefix + ' ' + this.name
        if(this.metadata?.suffix) this.name = this.name + ' ' + this.metadata.suffix
        if(this.metadata?.emote) this.emote = this.metadata.emote
        if(this.metadata?.value) this.value = this.metadata.value
    },
    storeOptions: {
        metadata: [
            {
                id: 'bonk',
                price: 3000
            }
        ],
        onLoad(index) {
            let meta = this.storeOptions.metadata[index]
            let skill: BattleActionBuilder = objectLoader([meta.id]).get(meta.id)
            if(!this.metadata) this.metadata = {}
            this.metadata.suffix = `(${skill.name})`
            this.metadata.description = skill.description
            this.metadata.value = meta.price
            this.onLoad.call(this)
            return this
        },
    }
}

export default obj