import { Guild } from "discord.js";
import { AAudioTrack, AudioTrack, AudioTrackEvents, AudioTrackHusk } from "./AudioTrack";
import { DiscordBotError } from "../types/error";
import { AsyncFunction } from "../types/asyncfunction";
import { Youtube } from "../util/Youtube";
import debugPrint, { debugExecute } from "../util/DebugPrint";

export type AudioManagerEvents = 'onQueueEnd' | 'onQueueAdd' | 'onQueuePop' | AudioTrackEvents;

export interface AudioTrackEventsMap {
	'onQueueEnd': { track: AAudioTrack };
	'onQueueAdd': { track: AAudioTrack };
	'onQueuePop': { track: AAudioTrack };
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
	private _is_loading_track: boolean = false;
	private _events: Map<AudioManagerEvents, AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>[]> = new Map<AudioManagerEvents, AsyncFunction<any, void>[]>();


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	private async m_downloadTrack(url: string): Promise<AudioTrackHusk | null> {
		this._is_loading_track = true;
		const track_buffer = await Youtube.getAudioBuffer(url);
		this._is_loading_track = false;
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
			this.call('onQueuePop', { track: this._current_track });
		} else {
			this._is_playing = false;
			this.call('onQueueEnd', { track: this._current_track });
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
		this.call('onEnd', { track: this._current_track });
	}

	public skip(): boolean {
		if (!this._current_track) return false;
		this._current_track.stop();
		return true;
	}

	private call(event: AudioManagerEvents, data: AudioTrackEventsMap[AudioTrackEventsMapKeys]) {
		this._events.get(event)?.map((func) => {
			func(data);
		});
	}

	public on(event: AudioManagerEvents, func: AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>) {
		if (!this._events.has(event)) {
			this._events.set(event, []);
		}
		this._events.get(event).push(func);
	}

	public async stopQueue() {
		this.stop();
		this._queue = [];
	}

	private m_shouldPlayTrackNow(): boolean {
		return this._queue.length === 0 && this._is_playing === false;
	}

	public async addToQueue(song: string) {
		//TODO: add song to queue
		const track = await this.m_downloadTrack(song);
		if (!track) throw new DiscordBotError("Failed to download track");
		track.on('onTick', async (byte: { byte: Buffer }) => {
			this.call('onTick', byte);
		});
		track.on('onEnd', async () => {
			this.call('onEnd', { track: this._current_track });
			this.m_pollQueue();
		});

		if (this.m_shouldPlayTrackNow() && !this._is_loading_track) {
			debugPrint("info", "[AudioManager] Playing track");
			this._current_track = track.cast();
			this._current_track.start();
			this._is_playing = true;
			this.call('onStart', null);
		} else {
			debugPrint("info", `[AudioManager] Added Track`);
			this.call('onQueueAdd', { track: track });
			this._queue.push(track);
		}
	}

}
