import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import { debugExecute } from "../../util/DebugPrint";
import Command from "./command";
import { Message } from "discord.js";
export const stop = new Command<Message, void>('stop', 'Stops The Bot From Playing', [],
	async ({ props, guild }) => {
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		audio_manager.stopQueue();
		const connection = getVoiceConnection(guild.id);
		if (!connection) throw new Error("No connection found")
		audio_manager.on('onEnd', async () => {
			if (connection) connection.destroy();
			debugExecute(() => {
				props.channel.send("**[DEBUG:ℹ️] Stopped Playing**");
			})
		});
	});
