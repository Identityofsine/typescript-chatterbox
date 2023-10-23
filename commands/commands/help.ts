import Command from "./command";
import { commands } from "./index";
import { Message } from "discord.js";

export const help = new Command<Message, void>('help', 'Shows this Menu', [], async ({ props, guild }) => {
	props.channel.send(`**Commands:**\n${commands.map((command) => {
		return `**${command.name}** - ${command.description}\n`;
	})}`);
});
