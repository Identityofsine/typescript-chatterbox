import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import GetMember from "../../util/GetMember";
import Command from "./command";
import { DiscordBotError } from "../../types/error";
import { AudioPlayer, AudioResource, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import debugPrint, { debugExecute } from "../../util/DebugPrint";
import { ArgumentGrabber } from "../arguments/arguments";
import { AudioTrack } from "../../audioplayer/AudioTrack";

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

			if (audio_manager.isPlaying) {

			} else {
				audio_manager.on('onStart', async ({ track }: { track: AudioTrack }) => {
					if (track === undefined) return;
					props.channel.send("**NOW PLAYING : *" + track.title + "*.**");
				});
				audio_manager.on('onTick', async ({ byte }: { byte: Buffer }) => {
					connection.playOpusPacket(byte);
				})
				audio_manager.on('onQueueAdd', async ({ track }: { track: AudioTrack }) => {
					props.channel.send("**ADDED : *" + track.title + "*.**")
				});
				audio_manager.on('onQueuePop', async ({ track }: { track: AudioTrack }) => {
					props.channel.send("**NOW PLAYING : *" + track.title + "*.**");
				});
				audio_manager.on('onQueueEnd', async ({ track }: { track: AudioTrack }) => {
					connection.disconnect();
					debugExecute(() => {
						props.channel.send(`**[DEBUG:ℹ️] I have finished playing ${track.title} **`);
					});
				});
			}

			audio_manager.addToQueue(url);

		} catch (e) {
			throw new DiscordBotError(e.message);
		}
	});
