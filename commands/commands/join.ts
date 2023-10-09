import { joinVoiceChannel, Message } from "discord.js";
import Command from "./command";

export const join = new Command<Message, void>('join', 'Join the voice channel you are in', [],
	async ({ props, guild }) => {
		if (guild) {
		}
	});
