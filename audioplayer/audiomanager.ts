import { Guild } from "discord.js";
import { AudioTrack, AudioTrackEvents } from "./AudioTrack";
import { DiscordBotError } from "../types/error";
import { AsyncFunction } from "../types/asyncfunction";
import { Youtube } from "../util/Youtube";
import debugPrint from "../util/DebugPrint";

export class AudioManager {
	private _guild: Guild;
	private _queue: AudioTrack[] = [];
	private _is_playing: boolean = false;
	private _current_track: AudioTrack;
	private _events: Map<String, AsyncFunction<{ byte: Buffer }, void>[]> = new Map<String, AsyncFunction<{ byte: Buffer }, void>[]>();


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	private async m_downloadTrack(url: string): Promise<AudioTrack | null> {
		const track_buffer = await Youtube.getAudioBuffer(url);
		if (track_buffer) {
			try {
				const track = new AudioTrack(track_buffer.buffer, track_buffer.video_info.title);
				return track;
			} catch (err) {
				//print stack trace

				debugPrint("[AudioManager] Failed to create audio track: " + err);
				throw err;
			}
		}
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

	public stop() {
		if (!this._current_track) throw new DiscordBotError("No track is playing");
		this._current_track.stop();
		this._is_playing = false;
	}

	public on(event: AudioTrackEvents, func: AsyncFunction<{ byte: Buffer }, void>) {
		if (!this._events.has(event)) {
			this._events.set(event, []);
		}
		this._events.get(event).push(func);
	}

	public async addToQueue(song: string) {
		//TODO: add song to queue
		const track = await this.m_downloadTrack(song);
		if (!track) throw new DiscordBotError("Failed to download track");
		track.on('onTick', async (byte: { byte: Buffer }) => {
			this._events.get('onTick').map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event(byte);
			});
		});
		track.on('onEnd', async () => {
			this._events.get('onEnd').map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event(null);
			});
		});
		this._current_track = track;
		track.start();
		this._queue.push(track);
	}

}
