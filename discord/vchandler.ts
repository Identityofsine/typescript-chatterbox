import { VoiceConnection, getVoiceConnection, joinVoiceChannel } from "@discordjs/voice";
import { Guild, VoiceBasedChannel, VoiceChannel } from "discord.js";

export default class VoiceConnectionHandler {
	private static _instance: VoiceConnectionHandler;
	private _voiceConnections: Map<string, VoiceConnection>;

	private constructor() {
		this._voiceConnections = new Map();
	}

	public static getInstance(): VoiceConnectionHandler {
		if (!VoiceConnectionHandler._instance) {
			VoiceConnectionHandler._instance = new VoiceConnectionHandler();
		}

		return VoiceConnectionHandler._instance;
	}

	public connectionExists(guild: Guild): boolean {
		return this._voiceConnections.has(guild.id);
	}

	private createVoiceConnection(guild: Guild, voice_channel: VoiceBasedChannel): VoiceConnection {
		const guild_id = guild.id;
		if (this.connectionExists(guild)) return this._voiceConnections.get(guild_id);
		const connection = getVoiceConnection(guild_id);
		if (connection) {
			this._voiceConnections.set(guild_id, connection);
			return connection
		};

		const new_connection = joinVoiceChannel({
			channelId: voice_channel.id,
			guildId: guild_id,
			adapterCreator: guild.voiceAdapterCreator,
		});

		this._voiceConnections.set(guild_id, new_connection);

		return new_connection;
	}

	public getVoiceConnection(guild: Guild, voice_channel?: VoiceBasedChannel): VoiceConnection | undefined {
		if (!this.connectionExists(guild) && voice_channel !== undefined) return this.createVoiceConnection(guild, voice_channel)
		return this._voiceConnections.get(guild.id);
	}


	public joinChannel(guild: Guild, voice_channel: VoiceBasedChannel): VoiceConnection {
		const connection = this.getVoiceConnection(guild, voice_channel);
		return connection;
	};

	public leaveChannel(guild: Guild): void {
		if (!this.connectionExists(guild)) return;
		const connection = this._voiceConnections.get(guild.id);
		connection.destroy();
		this._voiceConnections.delete(guild.id);
	}

}
