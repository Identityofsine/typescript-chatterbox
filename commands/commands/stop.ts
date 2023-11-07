import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import { debugExecute } from "../../util/DebugPrint";
import Command from "./command";
import { Message } from "discord.js";
import VoiceConnectionHandler from "../../discord/vchandler";
export const stop = new Command<Message, void>('stop', 'Stops The Bot From Playing', [],
	async ({ props, guild }) => {
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const message_notplaying = "**Nothing is playing**";
		if (!audio_manager.isPlaying) {
			props.channel.send(message_notplaying);
			return;
		}
		try {
			audio_manager.stopQueue();
		} catch (e) {
			props.channel.send(message_notplaying);
			return;
		}
		const connection = VoiceConnectionHandler.getInstance().leaveChannel(guild);
	});
