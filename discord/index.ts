import { Client, Message, ClientOptions } from "discord.js";
import debugPrint from "../util/DebugPrint";
import prefix_middleware from "../commands/middleware_command";

const token: string = "MTA5MTUwNzQwNTI0MzgxODA2NA.Gk-yhw.HJ5-cGEGIgNmRGJFWshRIAeMSuozZ9mb75fbxw";

const intents: ClientOptions['intents'] = ['Guilds', 'GuildMessages', 'GuildMessageReactions', "GuildVoiceStates", "GuildMembers", "MessageContent"];

const client = new Client({ intents: [...intents as any] });

client.on("ready", () => {
	console.log("[STATUS:✅] Bot is online")
});

client.on("messageCreate", prefix_middleware);


client.login(token);

export default client; 
