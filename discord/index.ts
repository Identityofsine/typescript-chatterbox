import { Client, Message, ClientOptions } from "discord.js";
import debugPrint from "../util/DebugPrint";
import prefix_middleware from "../commands/middleware_command";
import dotenv from "dotenv";

dotenv.config();

const token: string = process.env.DISCORD as string;

const intents: ClientOptions['intents'] = ['Guilds', 'GuildMessages', 'GuildMessageReactions', "GuildVoiceStates", "GuildMembers", "MessageContent"];

const client = new Client({ intents: [...intents as any] });


client.on("ready", () => {
	console.log("[STATUS:✅] Bot is online")
});

client.on("messageCreate", prefix_middleware);


client.login(token);

export default client; 
