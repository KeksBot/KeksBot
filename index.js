const discord = require('discord.js');
const { Intents, Client, Collection } = require('discord.js');
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_BANS,
		Intents.FLAGS.GUILD_MEMBERS,
		Intents.FLAGS.GUILD_INVITES,
		Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.GUILD_VOICE_STATES,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS
	]
});

const config = require('./config.json');
const commandHandler = require('./commandhandler');
const eventHandler = require('./eventhandler');
Collection.prototype.array = function() {
	return [ ...this.values() ];
};

var date = new Date();
console.log(
	`Starte System am ${date.getDate()}.${date.getMonth() +
		1}.${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`
);
global.cache = require('./db/startup');

client.once('ready', async () => {
	//Status
	client.user.setStatus('idle');
	client.restarting = 0;
	var start = Date.now();
	console.log(`[${client.user.username}]: Client geladen.`);
	console.log(`[${client.user.username}]: Monitoring wird aktiviert.`);
	const uptimeMonitoring = require('./uptimemonitoring');
	uptimeMonitoring(config.uptimeurl, client);
	console.log(`[${client.user.username}]: System wird gestartet.`);
	client.setMaxListeners(0);
	let mongoose = await require('./db/database')();
	console.log(`[${client.user.username}]: Verbindung zur Datenbank hergestellt.`);
	mongoose.connection.close();
	await commandHandler(client);
	await eventHandler(client);
	//await automod(client)
	var end = Date.now();
	console.log(`[${client.user.username}]: System aktiv.`);
	console.log(`[${client.user.username}]: Startzeit betrug ${end - start} ms.`);
	client.user.setStatus('online');
});

client.login(config.token);
