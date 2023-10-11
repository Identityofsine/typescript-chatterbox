import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import Command from "./command";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { debugExecute } from "../../util/DebugPrint";

export const skip = new Command<Message, void>('skip', 'Skip the current song', [],
	async ({ props, guild }) => {
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const sent_message = await props.channel.send("**Trying to Skipping...**");

		if (audio_manager.skip()) {
			debugExecute(() => props.channel.send("**[DEBUG] Skipped...**"));
			sent_message.edit("**Skipped Song...**");
		} else {
			debugExecute(() => props.channel.send("**[DEBUG] Queue Empty...**"));
			sent_message.edit("**Queue Empty...**");
			const connection = getVoiceConnection(guild.id);
			connection.disconnect();
		}
	});
