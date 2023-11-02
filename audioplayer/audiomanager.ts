import { Guild } from "discord.js";
import { AAudioTrack, AudioTrack, AudioTrackEvents, AudioTrackHusk } from "./AudioTrack";
import { DiscordBotError } from "../types/error";
import { AsyncFunction } from "../types/asyncfunction";
import { Youtube } from "../util/Youtube";
import debugPrint, { debugExecute } from "../util/DebugPrint";

export type _AudioManagerEvents = 'onQueueEnd' | 'onQueueAdd' | 'onQueuePop' | 'onSuccessSubmittion'

export type AudioManagerEvents = _AudioManagerEvents | AudioTrackEvents;

export interface AudioTrackEventsMap {
	'onQueueEnd': { track: AAudioTrack };
	'onQueueAdd': { track: AAudioTrack };
	'onQueuePop': { track: AAudioTrack };
	'onSuccessSubmittion': { track: AAudioTrack };
	'onTick': { byte: Buffer };
	'onEnd': { track: AudioTrack };
	'onStart': null;
	'onReady': null;
	'onError': { error: Error };
}

export type AudioTrackEventsMapKeys = keyof AudioTrackEventsMap;


export class AudioManager {
	private _guild: Guild;
	private _queue: AudioTrackHusk[] = [];
	private _is_playing: boolean = false;
	private _current_track: AudioTrack;
	private _is_loading_track: boolean = false;
	private _already_init: boolean = false;
	private _events: Map<AudioManagerEvents, AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>[]> = new Map<AudioManagerEvents, AsyncFunction<any, void>[]>();
	private _search_active: boolean = false;
	private _last_search_results: Youtube.SearchResult[] = [];


	constructor(guild: Guild) {
		this._guild = guild;
	}

	private m_play(): void {

	}

	private m_audioTrackHuskFactory(buffer: Buffer, title: string): AudioTrackHusk {
		const audio_track = new AudioTrackHusk(buffer, title);

		return audio_track;
	}

	private async m_downloadTrack(url: string): Promise<AudioTrackHusk | null> {
		this._is_loading_track = true;
		const track_buffer = await Youtube.getAudioBuffer(url);
		this._is_loading_track = false;
		if (track_buffer) {
			try {
				const track = this.m_audioTrackHuskFactory(track_buffer.buffer, track_buffer.video_info.title);
				return track;
			} catch (err) {
				debugPrint("error", "[AudioManager] Failed to create audio track: " + err);
				this.call('onError', { error: err })
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

	public get queue(): Array<AudioTrackHusk> {
		return this._queue;
	}

	public isQueueEmpty(): boolean {
		return this._queue.length === 0;
	}

	public set searchActive(active: boolean) {
		this._search_active = active;
	}

	public set queryResults(results: Youtube.SearchResult[]) {
		this._last_search_results = results;
	}

	public get queryResults(): Youtube.SearchResult[] {
		return this._last_search_results;
	}

	public get searchActive(): boolean {
		return this._search_active;
	}

	public query(index: number): Youtube.SearchResult {
		return this._last_search_results[index];
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

	public onInit(func: Function): boolean {
		if (this._already_init) return false;
		func();
		this._already_init = true;
		return true;

	}


	public async stopQueue() {
		this.stop();
		this._queue = [];
	}

	private m_shouldPlayTrackNow(): boolean {
		return this._is_playing === false && !this._is_loading_track;
	}

	public async addToQueue(song: string | AudioTrackHusk) {

		let track: AudioTrackHusk;
		if (song instanceof AudioTrackHusk) {
			track = song;
		} else {
			const pre_song = song as string;
			const valid_url = Youtube.validYoutubeVideo(pre_song);
			if (!valid_url) throw new DiscordBotError("Invalid Youtube URL");

			const song_info = await Youtube.getYoutubeVideoInfo(pre_song);
			this.call('onSuccessSubmittion', { track: new AudioTrackHusk(null, song_info.title) });

			debugPrint("info", "[AudioManager] Downloading track");
			track = await this.m_downloadTrack(pre_song);
			if (!track) throw new DiscordBotError("Failed to download track");
		}

		track.on('onTick', async (byte: { byte: Buffer }) => {
			this.call('onTick', byte);
		});
		track.on('onEnd', async () => {
			this.call('onEnd', { track: this._current_track });
			this.m_pollQueue();
		});

		if (this.m_shouldPlayTrackNow()) {
			debugPrint("info", "[AudioManager] Playing track");
			this._current_track = track.cast();
			this._current_track.start();
			this._is_playing = true;
			this.call('onStart', { track: this._current_track });
		} else {
			debugPrint("info", `[AudioManager] Added Track`);
			this.call('onQueueAdd', { track: track });
			this._queue.push(track);
		}
	}

}
