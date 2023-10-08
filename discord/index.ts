import { Client } from "discord.js";

const token: string = "MTA5MTUwNzQwNTI0MzgxODA2NA.Gk-yhw.HJ5-cGEGIgNmRGJFWshRIAeMSuozZ9mb75fbxw";

const intents = ['Guilds', 'GuildMessages', 'GuildMessageReactions', "GuildVoiceStates"];

const client = new Client({ intents: intents as any });

client.on("ready", () => {
	console.log("[STATUS:✅] Bot is online")
});

client.login(token);

export default client; 
