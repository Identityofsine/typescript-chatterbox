import { Guild } from "discord.js";
import { AudioTrack, AudioTrackEvents, AudioTrackHusk } from "./AudioTrack";
import { DiscordBotError } from "../types/error";
import { AsyncFunction } from "../types/asyncfunction";
import { Youtube } from "../util/Youtube";
import debugPrint, { debugExecute } from "../util/DebugPrint";

export type AudioManagerEvents = 'onQueueEnd' | AudioTrackEvents;

export interface AudioTrackEventsMap {
	'onQueueEnd': { track: AudioTrack };
	'onTick': { byte: Buffer };
	'onEnd': { track: AudioTrack };
	'onStart': null;
	'onReady': null;
}

export type AudioTrackEventsMapKeys = keyof AudioTrackEventsMap;


export class AudioManager {
	private _guild: Guild;
	private _queue: AudioTrackHusk[] = [];
	private _is_playing: boolean = false;
	private _current_track: AudioTrack;
	private _events: Map<AudioManagerEvents, AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>[]> = new Map<AudioManagerEvents, AsyncFunction<any, void>[]>();


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	private async m_downloadTrack(url: string): Promise<AudioTrackHusk | null> {
		const track_buffer = await Youtube.getAudioBuffer(url);
		if (track_buffer) {
			try {
				const track = new AudioTrackHusk(track_buffer.buffer, track_buffer.video_info.title);
				return track;
			} catch (err) {
				debugPrint("error", "[AudioManager] Failed to create audio track: " + err);
				throw err;
			}
		}
		return null;
	}

	private m_pollQueue(): void {
		if (this._queue.length > 0) {
			const track = this._queue.shift().cast();
			this._current_track = track;
			this._current_track.start();
		} else {
			this._is_playing = false;
			this._events.get('onQueueEnd')?.map((event) => {
				event({ track: this._current_track });
			});
		}
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

	public on(event: AudioManagerEvents, func: AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>) {
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
			this._events.get('onEnd')?.map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event(null);
			});
			this.m_pollQueue();
		});

		if (this._queue.length === 0 && this._is_playing === false) {
			debugPrint("info", "[AudioManager] Playing track");
			this._current_track = track.cast();
			this._current_track.start();
			this._is_playing = true;
		} else {
			debugPrint("info", "[AudioManager] Added Track");
			this._queue.push(track);
		}
	}

}
