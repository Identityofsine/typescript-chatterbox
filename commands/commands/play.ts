import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import GetMember from "../../util/GetMember";
import Command from "./command";
import { DiscordBotError } from "../../types/error";
import { AudioPlayer, AudioResource, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import debugPrint, { debugExecute } from "../../util/DebugPrint";
import { ArgumentGrabber } from "../arguments/arguments";
import { AudioTrack } from "../../audioplayer/AudioTrack";
import { URL } from "../../util/URL";
import { Youtube } from "../../util/Youtube";
import VoiceConnectionHandler from "../../discord/vchandler";

export const play = new Command<Message, void>('play', 'The bot plays(or queues) a song via search or URL.', [],
	async ({ props, guild }) => {
		const user = props.author;
		const member = GetMember(user, guild);
		const audio_manager = AudioInstance.getInstance().getAudioManager(guild);
		const voice_channel = member.voice.channel;

		let url = ArgumentGrabber<'url' | 'query'>(props, ['url']).url;
		if (url === undefined) {
			throw new DiscordBotError("No url provided");
		}

		const cancel_search = () => {
			audio_manager.searchActive = false;
			audio_manager.queryResults = [];
		}

		const search = async () => {
			try {
				url = props.content.split(' ').filter((arg) => !arg.startsWith('--')).slice(1).join(' ');
				//filter "--" from URL
				const search_results = await Youtube.search(url);
				let message_result = "";
				search_results.map((result, index) => {
					message_result += `**${index + 1}.** ${result.snippet.title}\n`;
				});
				props.channel.send(message_result);
				audio_manager.searchActive = true;
				audio_manager.queryResults = search_results;
				return;
			}
			catch (e) {
				throw new DiscordBotError("Something went wrong with the query results... Try Again...");
			}
		}

		if (!URL.isValidURL(url)) {
			if (audio_manager.searchActive) {
				//check if url is a number, should be if search mode is one, if not ignore
				if (isNaN(Number(url))) {
					search();
					return;
				}
				//check if number is in range
				if (Number(url) > audio_manager.queryResults.length || Number(url) < 1) {
					cancel_search();
					throw new DiscordBotError("Number out of range");
				}
				//grab youtube video
				const youtube_video = audio_manager.query(Number(url) - 1);
				if (!youtube_video) {
					cancel_search();
					throw new DiscordBotError("Something went wrong with the query results... Try Again...");
				}
				//get url from query results
				url = `https://www.youtube.com/watch?v=${youtube_video.id.videoId}`
				props.channel.send(`**You Chose: "${youtube_video.snippet.title} - ${youtube_video.snippet.channelTitle}"**`);
				cancel_search();
			}
			else {
				await search();
				return;
			}
		} else if (URL.isValidURL(url) && audio_manager.searchActive) {
			//disable search and immediately play url
			cancel_search();
			props.channel.send("**[DEBUG:ℹ️] Search disabled.**");
		}

		if (!voice_channel) throw new DiscordBotError("You must be in a voice channel to use this command");
		//#region connection verifyier
		let connection = VoiceConnectionHandler.getInstance().joinChannel(guild, voice_channel);
		const sent_message = await props.channel.send("**[DEBUG] Handling your request...**");

		//#region audio handling
		try {
			audio_manager.onInit(() => {
				audio_manager.on('onStart', async ({ track }: { track: AudioTrack }) => {
					if (track === undefined) return;
					props.channel.send("**NOW PLAYING : *" + track.title + "*.**");
				});
				audio_manager.on('onTick', async ({ byte }: { byte: Buffer }) => {
					VoiceConnectionHandler.getInstance().getVoiceConnection(guild)?.playOpusPacket(byte);
				})
				audio_manager.on('onQueueAdd', async ({ track }: { track: AudioTrack }) => {
					props.channel.send("**ADDED : *" + track.title + "*.**")
				});
				audio_manager.on('onQueuePop', async ({ track }: { track: AudioTrack }) => {
					props.channel.send("**NOW PLAYING : *" + track.title + "*.**");
				});
				audio_manager.on('onQueueEnd', async ({ track }: { track: AudioTrack }) => {

					VoiceConnectionHandler.getInstance().getVoiceConnection(guild)?.disconnect();
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
			connection.disconnect();
			throw new DiscordBotError(e.message);
		}
	});
