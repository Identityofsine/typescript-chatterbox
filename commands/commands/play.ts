import { Message } from "discord.js";
import { AudioInstance } from "../../audioplayer/AudioInstance";
import GetMember from "../../util/GetMember";
import Command from "./command";
import { DiscordBotError } from "../../types/error";
import { getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";

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
		audio_manager.on('onTick', async ({ byte }: { byte: Buffer }) => {
			connection.playOpusPacket(byte);
		});
		audio_manager.addToQueue("https://www.youtube.com/watch?v=Wj8pZ1wTKB8");

	});
