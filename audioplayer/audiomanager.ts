import { Guild } from "discord.js";

export class AudioManager {
	private _guild: Guild;
	private _queue: string[] = [];
	private _is_playing: boolean = false;


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	public get guild(): Guild {
		return this._guild;
	}

	public get isPlaying(): boolean {
		return this._is_playing;
	}

	public isQueueEmpty(): boolean {
		return this._queue.length === 0;
	}

	public addToQueue(song: string): void {
		this._queue.push(song);
	}

}
