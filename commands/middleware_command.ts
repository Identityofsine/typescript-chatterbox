import { Message } from "discord.js";
import debugPrint, { debugExecute } from "../util/DebugPrint";
import { commands } from "./commands";
// Purpose: Provides a middleware function for the command handler.

const prefix: string = "!^";

export default function prefix_middleware(message: Message) {
	if (message.content.length === 0) return;

	if (message.content.startsWith(prefix)) {
		//get name from  !^name 
		const name = message.content.split(" ")[0].slice(prefix.length).trimStart();
		const command = commands.find(command => command.name === name);
		if (command) {
			debugPrint("info", "[DEBUG] Command found \"%s\", executing callback", command.name);
			try {
				command.callback({ props: message, guild: message.guild }).catch((e: Error) => {
					debugPrint("error", "[ERROR:%s]", command.name, e.message);
					debugExecute(() => {
						message.reply("Error executing command.");
						message.react("❌");
					})
				});
			} catch (e) {
				debugPrint("error", `[ERROR:${e.message}]`);
				debugExecute(() => {
					message.reply("Error executing command: " + e.message);
					message.react("❌");
				})
			}
		}

		message.react("✅");
	}
}
