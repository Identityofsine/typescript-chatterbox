import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import Command from "./command";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";

export const skip = new Command<Message, void>('skip', 'Skip the current song', [],
	async ({ props, guild }) => {
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		if (audio_manager.skip()) {
			props.channel.send("**Skipped...**");
		} else {
			props.channel.send("**Queue Empty...**");
			const connection = getVoiceConnection(guild.id);
			connection.disconnect();
		}
	});
