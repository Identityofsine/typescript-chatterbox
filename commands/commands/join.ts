import { Message } from "discord.js";

import Command from "./command";
import { joinVoiceChannel } from "@discordjs/voice";
import debugPrint from "../../util/DebugPrint";

export const join = new Command<Message, void>('join', 'Join the voice channel you are in', [],

	async ({ props, guild }) => {
		if (!props?.member) throw new Error('Member not found.');
		const channel_id = props.member?.voice.channelId ?? -1; // Get the channel id of the user
		const guild_id = guild?.id ?? -1;
		if (channel_id === -1 || guild_id === -1) {
			throw new Error('User not in voice channel.');
		}
		const connection = joinVoiceChannel({
			channelId: channel_id,
			guildId: guild_id,
			adapterCreator: guild?.voiceAdapterCreator ?? null,
		});
		props.channel.send('Joining your stupid voice channel...');
		connection.on('error', (error) => {
			debugPrint(error.message);
			props.channel.send('Error joining voice channel.');
			throw new Error(error.message);
		});
	});
