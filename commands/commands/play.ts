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

		const sent_message = await props.channel.send("**[DEBUG] Handling your request...**");

		//#region audio handling
		try {
			const url = ArgumentGrabber<'url' | 'query'>(props, ['url']).url;

			if (url === undefined) {
				connection.destroy();
				throw new DiscordBotError("No url provided");
			}

			audio_manager.onInit(() => {
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
			});

			await audio_manager.addToQueue(url);
			sent_message.edit("**Your request has been handled.**");
			sent_message.react('✅');


		} catch (e) {
			sent_message.edit(`**There was an error with your request...** \`(${e.message})\``);
			throw new DiscordBotError(e.message);
		}
	});
