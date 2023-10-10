import { Guild } from "discord.js";
import { AudioManager } from "./audiomanager";
import { DiscordBotError } from "../types/error";

export class AudioInstance {
	private static _instance: AudioInstance;
	private _audio_map: Map<Guild, AudioManager> = new Map<Guild, AudioManager>();

	private constructor() {
		// do nothing
		if (AudioInstance._instance) {
			throw new DiscordBotError("AudioInstance is a singleton class. Use AudioInstance.getInstance() instead.");
		}
	}

	public static getInstance(): AudioInstance {
		if (!AudioInstance._instance) {
			AudioInstance._instance = new AudioInstance();
		}
		return AudioInstance._instance;
	}

	public getAudioManager(guild: Guild): AudioManager {
		if (!this._audio_map.has(guild)) {
			this._audio_map.set(guild, new AudioManager(guild));
		}
		return this._audio_map.get(guild);
	}


}
