const discord = require('discord.js');
const embeds = require('../../embeds');
const getData = require('../../db/getData');
const update = require('../../db/update');

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('gift')
		.setDescription('Schenk jemandem Kekse')
		.addUserOption(opt =>
			opt.setName('user').setDescription('Der Nutzer, dem du Kekse schenken willst').setRequired(true)
		)
		.addIntegerOption(opt =>
			opt.setName('user').setDescription('Anzahl der Kekse, die du verschenken willst').setRequired(true)
		),
	name: this.data.name,
	description: this.data.description,
	options: this.data.options,
	async execute(ita, args, client) {
		var { guild, user } = ita;
		var member = await guild.members.fetch(args.user);
		if (!member) return embeds.error(ita, 'Fehler', 'Der angegebene Nutzer konnte nicht gefunden werden.', true);
		if (args.count <= 0)
			return embeds.error(
				ita,
				'Syntaxfehler',
				`Es wäre schön, wenn sich ${member.displayName} auch über dein Geschenk freuen könnte, also gib bitte eine positive Zahl an.`,
				true
			);

		member.data = (await getData('userdata', member.id)) || 0;
		if (!user.data.cookies)
			return embeds.error(
				ita,
				'Fehler',
				'Du hast keine Kekse, die du verschenken kannst.\nBenutz zuerst `/cookies`, um welche zu bekommen.',
				true
			);
		if (!member.data.cookies) member.data.cookies = 0;

		if (args.count > user.data.cookies) args.count = user.data.cookies;

		member.data.cookies += args.count;
		user.data.cookies -= args.count;

		await update('userdata', user.id, { cookies: user.data.cookies });
		await update('userdata', member.id, { cookies: member.cookies });

		return embeds.success(
			ita,
			'Kekse übertragen',
			`Du hast <@${member.id}> ${args.count} Kekse geschenkt.`.replace(' 1 Kekse', ' einen Keks'),
			true
		);
	}
};
