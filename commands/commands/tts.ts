import { Message } from "discord.js";
import Command from "./command";
import { TTS } from "../../util/TTS";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { PCM } from "../../util/PCM";
import { AudioTrack, AudioTrackHusk } from "../../audioplayer/AudioTrack";
import debugPrint, { debugExecute } from "../../util/DebugPrint";
import { DiscordBotError } from "../../types/error";
import { ArgumentGrabber } from "../arguments/arguments";
import VoiceConnectionHandler from "../../discord/vchandler";

export const tts = new Command<Message, void>('tts', 'The bot queues a TTS via TikTok\'s API', [],
	async ({ props, guild }) => {

		const member = props.member;
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const voice_channel = member.voice.channel;

		let text = props.content.split(' ').filter((arg) => !arg.startsWith('--')).slice(1).join(' ');
		let voice: TTS.TiktokVoices = 'en_us_001';

		/*
		 * ArgumentGrabber
		 *
		 */

		const voice_arg: string = ArgumentGrabber<'voice'>(props, ['voice'])?.voice;

		if (voice === undefined) {

		} else {
			if (voice_arg.toLowerCase() in TTS.TikTokTTSVoices) {
				voice = TTS.TikTokTTSVoices[voice_arg.toLowerCase()];
				//cut out last word
				if (voice_arg.length > 0) {
					text = text.split(' ').slice(0, -1).join(' ');
				}
			}

		}

		let connection = VoiceConnectionHandler.getInstance().joinChannel(guild, voice_channel);

		try {

			audio_manager.onInit(() => {
				audio_manager.on('onStart', async ({ track }: { track: AudioTrack }) => {
					if (track === undefined) return;
					props.channel.send("**NOW PLAYING : *" + track.title + "*.**");
				});
				audio_manager.on('onTick', async ({ byte }: { byte: Buffer }) => {
					VoiceConnectionHandler.getInstance().getVoiceConnection(guild).playOpusPacket(byte);
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

			const buffer = await TTS.getTTS(voice, text);
			const pcm_buffer = await PCM.ffpmegToPCM(buffer);
			const audio_track = new AudioTrackHusk(pcm_buffer, text);
			//audio_buffer: Buffer, title?: string
			await audio_manager.addToQueue(audio_track);

		} catch (e) {
			connection.disconnect();
			throw new DiscordBotError(e.message);
		}
	});
