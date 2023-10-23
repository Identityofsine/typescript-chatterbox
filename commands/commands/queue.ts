import { Message } from "discord.js";
import Command from "./command";
import { AudioManager } from "../../audioplayer/audiomanager";
import { AudioInstance } from "../../audioplayer/AudioInstance";

export const queue = new Command<Message, void>("queue", "View the Current Queue", [],
	async ({ props, guild }) => {
		//get audio manager	
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const channel = props.channel;
		const message_1: string = "**There is nothing queued!**"
		if (!audio_manager) {
			channel.send(message_1);
			return;
		}
		if (audio_manager.isQueueEmpty()) {
			channel.send(message_1);
			return;
		}
		const queue = audio_manager.queue;
		let message = "**Queue:**\n";
		for (let i = 0; i < queue.length; i++) {
			message += `${i + 1}. ${queue[i].title}\n`;
		}
		channel.send(message);

	});
