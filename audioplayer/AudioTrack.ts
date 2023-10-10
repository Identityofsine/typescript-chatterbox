import { OpusEncoder } from "@discordjs/opus";
import { Transform, Readable } from "stream";
import { AsyncFunction } from "../types/asyncfunction";
import debugPrint from "../util/DebugPrint";
import { PCM } from "../util/PCM";

export type AudioTrackEvents = 'onTick' | 'onEnd' | 'onStart';

export class AudioTrack {
	private _title: string;
	private _url: string;
	private _duration: number;
	private _thumbnail: string;
	private _events: Map<String, AsyncFunction<{ byte: Buffer }, void>[]> = new Map<String, AsyncFunction<{ byte: Buffer }, void>[]>();
	private _is_playing: boolean = false;
	private _audio_buffer: Buffer;
	private _audio_stream_opec: Buffer[];

	/**
	 * @param audio_buffer The audio buffer to play, this must be in PCM format
	 */
	constructor(audio_buffer: Buffer, title?: string, url?: string, duration?: number, thumbnail?: string) {
		this._title = title;
		this._url = url;
		this._duration = duration;
		this._thumbnail = thumbnail;
		this._audio_buffer = audio_buffer;
		this._audio_stream_opec = AudioTrack.m_encodeAudio(audio_buffer);
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

	public get opusPackets(): Buffer[] {
		return this._audio_stream_opec;
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

	//@ts-ignore
	public static m_encodeAudio(audio_buffer: Buffer): Buffer[] {
		const MAX_BUFFER_SIZE = PCM.getOpumSize(48000, 2, 20);		//max buffer size for opus encoding
		const encoder = new OpusEncoder(48000, 2);
		const opus_buffer: Buffer[] = [];

		for (let i = 0; i < audio_buffer.length; i += MAX_BUFFER_SIZE) {
			const chunk = audio_buffer.slice(i, i + MAX_BUFFER_SIZE);
			try {
				const encoded_chunk = encoder.encode(chunk);
				opus_buffer.push(encoded_chunk);
			} catch (err) {
				debugPrint("[AudioTrack] Failed to encode audio chunk: " + err);
			}
		}
		return opus_buffer;
	}

	//play through the track opec and call the onTick event
	private async m_onTick() {
		//start track loop, this should progress through the track at the right speed
		for (let i = 0; i < this._audio_stream_opec.length; i++) {
			const packet = this._audio_stream_opec[i];
			this._events.get('onTick').map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event({ byte: packet });
			});
			//wait 2.5ms

		}
	}

}
