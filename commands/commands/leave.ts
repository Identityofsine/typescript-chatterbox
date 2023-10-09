import { Message } from "discord.js";
import Command from "./command";
import { getVoiceConnection } from "@discordjs/voice";

export const leave = new Command<Message, void>('leave', 'Leave the voice channel you are in', [],
	async ({ props, guild }) => {
		const guild_id = guild?.id ?? -1;
		if (guild_id === -1) {
			throw new Error('Guild not found.');
		}
		const connection = getVoiceConnection(guild_id);
		if (connection === undefined) {
			throw new Error('Not in a voice channel.');
		}
		props.reply('Leaving your stupid voice channel...');
		connection.destroy();

	});
