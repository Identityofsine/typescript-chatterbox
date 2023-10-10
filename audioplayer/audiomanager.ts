import { Guild } from "discord.js";
import { AudioTrack, AudioTrackEvents } from "./AudioTrack";
import { DiscordBotError } from "../types/error";
import { AsyncFunction } from "../types/asyncfunction";

export class AudioManager {
	private _guild: Guild;
	private _queue: AudioTrack[] = [];
	private _is_playing: boolean = false;
	private _events: Map<String, AsyncFunction<{ byte: Buffer }, void>[]> = new Map<String, AsyncFunction<{ byte: Buffer }, void>[]>();


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	private m_downloadTrack(url: string): AudioTrack | null {
		return null;
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

	public on(event: AudioTrackEvents, func: AsyncFunction<{ byte: Buffer }, void>) {
		if (!this._events.has(event)) {
			this._events.set(event, []);
		}
		this._events.get(event).push(func);
	}

	public addToQueue(song: string): void {
		//TODO: add song to queue
		const track = this.m_downloadTrack(song);
		if (!track) throw new DiscordBotError("Failed to download track");
		track.on('onTick', async (byte: { byte: Buffer }) => {
			this._events.get('onTick').map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event(byte);
			});
		});
		this._queue.push(track);
	}

}
