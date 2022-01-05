const discord = require('discord.js');
const embeds = require('../../embeds');

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eat')
		.setDescription('Konvertiert deine Kekse zu Erfahrungspunkten')
		.addIntegerOption(opt =>
			opt.setName('count').setDescription('Anzahl der Kekse, die du essen willst').setRequired(true)
		),
	name: this.data.name,
	description: this.data.description,
	options: this.data.options,
	async execute(ita, args, client) {
		var { guild, user, color } = ita;
		if (args.count <= 0)
			return embeds.error(
				ita,
				ita.user.id,
				'Syntaxfehler',
				'Bitte gib eine positive Zahl an. Keiner will, dass du Kekse kotzt.'
			);

		if (!user.data.cookies) user.data.cookies = 0;
		if (!user.data.xp) user.data.xp = 0;
		if (!user.data.level) user.data.level = 1;

		if (args.count > user.data.cookies) args.count = user.data.cookies;

		if (!args.count && user.data.cookies) return embeds.success(ita, 'NomNom', 'Oder auch nicht.', true);
		else if (!user.data.cookies)
			return embeds.error(
				ita,
				'Fehler',
				'Du kannst keine Kekse essen D:\nBenutz zuerst `/cookies`, um welche zu bekommen.',
				true
			);

		user.data.xp += args.count;
		user.data.cookies -= args.count;
		var levelup = false;

		while (128 * (2 ** user.data.level) ** 2 <= user.data.xp) {
			user.data.level++;
			levelup = true;
		}

		var embed = new discord.MessageEmbed();
		if (levelup) {
			embed
				.setColor(color.normal)
				.setTitle('Level Up')
				.setDescription(
					`Du hast ${args.count} Kekse gegessen.\nDadurch hast du nun ${user.data
						.xp} Erfahrungspunkte und bist somit auf **Level ${user.data
						.level}**.\nHerzlichen Glückwunsch!`.replace(' 1 Kekse', ' einen Keks')
				);
		} else {
			embed
				.setColor(color.lime)
				.setTitle(`${require('../../emotes.json').accept} Kekse gegessen`)
				.setDescription(
					`Du hast ${args.count} Kekse gegessen.\nDadurch hast du nun ${user.data
						.xp} Erfahrungspunkte. Es fehlen noch ${128 * (2 ** user.data.level) ** 2 -
						user.data.xp} Erfahrungspunkte, um Level ${user.data.level + 1} zu erreichen.`
				);
		}
		return await ita.reply({ embeds: [ embed ], ephemeral: true });
	}
};
