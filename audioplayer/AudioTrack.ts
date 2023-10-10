import { OpusEncoder } from "@discordjs/opus";
import { AsyncFunction } from "../types/asyncfunction";

export type AudioTrackEvents = 'onTick' | 'onEnd' | 'onStart';

export class AudioTrack {
	private _title: string;
	private _url: string;
	private _duration: number;
	private _thumbnail: string;
	private _events: Map<String, AsyncFunction<{ byte: Buffer }, void>[]> = new Map<String, AsyncFunction<{ byte: Buffer }, void>[]>();
	private _is_playing: boolean = false;
	private _audio_buffer: Buffer;

	constructor(audio_buffer: Buffer, title?: string, url?: string, duration?: number, thumbnail?: string) {
		this._title = title;
		this._url = url;
		this._duration = duration;
		this._thumbnail = thumbnail;
		this._audio_buffer = AudioTrack.m_encodeAudio(audio_buffer);
	}

	public get title(): string {
		return this._title;
	}

	public get url(): string {
		return this._url;
	}

	public get duration(): number {
		return this._duration;
	}

	public get thumbnail(): string {
		return this._thumbnail;
	}

	public on(event: AudioTrackEvents, func: AsyncFunction<{ byte: Buffer }, void>) {
		if (!this._events.has(event)) {
			this._events.set(event, []);
		}
		this._events.get(event).push(func);
	}

	public start(): void {
		if (this._is_playing) {
			return;
		}
		this.m_onTick();
	}

	public stop(): void {
		this._events.get('onEnd').map((event: AsyncFunction<any, void>) => {
			event(null);
		});
	}

	private static m_encodeAudio(audio_buffer: Buffer): Buffer {
		const encoder = new OpusEncoder(48000, 2);
		return encoder.encode(audio_buffer);
	}

	//play through the track opec and call the onTick event
	private async m_onTick() {
		//start track loop, this should progress through the track at the right speed
		for (let i = 0; i < this._audio_buffer.length; i++) {
			if (!this._is_playing) break;
			const event_param = this._audio_buffer[i];
			this._events.get('onTick').map((event: AsyncFunction<{ byte: number }, void>) => {
				event({ byte: event_param });
			});
		}
	}

}
