import Discord = require('discord.js')

interface RenderOptions {
    title?: string,
    text: string,
    color?: Discord.ColorResolvable,
    fields?: [{
        name: string,
        value: string,
        inline: boolean
    }]
}

module.exports = class {
    user: BattleUser
    battle: BaseBattle
    save: string
    title: string
    color: Discord.ColorResolvable
    fields: [{
        name: string,
        value: string,
        inline: boolean
    }]

    constructor(user: BattleUser, battle: BaseBattle) {
        this.user = user;
        this.battle = battle;
        this.save = '';
        //@ts-ignore
        this.fields = [];
    }

    renderEmbed({ title, text, color, fields }: RenderOptions) {
        return new Discord.MessageEmbed()
            .setTitle(title ? title : this.title)
            .setColor(color ? color : this.color || this.battle.color.normal)
            .setDescription(this.save)
            .setFooter({ text })
            .addFields(this.fields || [])
            .addFields(fields || [])
    }

    setTitle(title: string) {
        this.title = title;
        return this;
    }

    setColor(color?: Discord.ColorResolvable) {
        this.color = color ? color : this.battle.color.normal;
        return this;
    }

    addField(name: string, value: string, inline: boolean) {
        this.fields.push({ name, value, inline });
        return this;
    }

    addFields(fields: [{
        name: string,
        value: string,
        inline: boolean
    }]) {
        //@ts-ignore
        this.fields = this.fields.concat(fields);
        return this;
    }

    clearFields() {
        //@ts-ignore
        this.fields = [];
        return this;
    }

    async update({text, title, color, fields}: RenderOptions, options?: Discord.InteractionUpdateOptions) {
        await this.user.interaction.update(Object.assign(options || {}, { embeds: this.renderEmbed({ text, title, color, fields }) }));
        return this.user.interaction;
    }

    render() {
        let users = this.battle.users.filter(u => u.team == this.user.team)
        let enemies = this.battle.users.filter(u => u.team != this.user.team)

        let enemyText = enemies.map(u =>
            `${`${u.member.displayName} • Lv. ${u.user.data.level}`.padStart(42)}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padStart(20, '▁').padStart(42)}`
        ).join('\n')

        let userText = users.map(u => {
            return u.user.id == this.user.id
                ? null
                : `${u.member.displayName} • Lv. ${u.user.data.level}\n${''.padEnd(Math.floor(u.battle.currentHP / u.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')}`
        }).filter(u => u).join('\n')

        userText += `\n${this.user.member.displayName} • Lv. ${this.user.user.data.level}\n${''.padEnd(Math.floor(this.user.battle.currentHP / this.user.skills.find(skill => skill.name == 'HP').value * 20 + 0.99999999999), '█').padEnd(20, '▁')} ${this.user.battle.currentHP} / ${this.user.skills.find(skill => skill.name == 'HP').value} HP`

        this.save = `\`\`\`${enemyText}\n\n\n${userText}\`\`\``
        return this;
    }
}