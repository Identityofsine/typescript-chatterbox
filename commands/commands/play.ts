import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import GetMember from "../../util/GetMember";
import Command from "./command";
import { DiscordBotError } from "../../types/error";
import { AudioPlayer, AudioResource, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import debugPrint, { debugExecute } from "../../util/DebugPrint";
import { ArgumentGrabber } from "../arguments/arguments";

export const play = new Command<Message, void>('play', 'Play a song', [],
	async ({ props, guild }) => {
		const user = props.author;
		const member = GetMember(user, guild);
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const voice_channel = member.voice.channel;

		if (!voice_channel) throw new DiscordBotError("You must be in a voice channel to use this command");
		//#region connection verifyier
		let connection = getVoiceConnection(guild.id);
		if (!connection) {
			connection = joinVoiceChannel({
				channelId: voice_channel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});
		} else if (connection.state.status === 'disconnected') {
			connection = joinVoiceChannel({
				channelId: voice_channel.id,
				guildId: guild.id,
				adapterCreator: guild.voiceAdapterCreator,
			});
		}
		//#region audio handling
		try {
			const url = ArgumentGrabber<'url' | 'query'>(props, ['url']).url;

			debugExecute(() => {
				if (url)
					props.channel.send("**[DEBUG:ℹ️] Trying to Play : *" + url + "***");
				else
					props.channel.send("**[DEBUG:❌] No url provided**");
			});

			if (url === undefined) {
				connection.destroy();
				throw new DiscordBotError("No url provided");
			}

			audio_manager.on('onTick', async ({ byte }) => {
				connection.playOpusPacket(byte);
			})
			audio_manager.addToQueue(url);
		} catch (e) {
			throw new DiscordBotError(e.message);
		}
	});
