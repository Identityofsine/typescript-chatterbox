import { OpusEncoder } from "@discordjs/opus";
import { AsyncFunction } from "../types/asyncfunction";
import { AudioTrackEventsMap, AudioTrackEventsMapKeys } from "./audiomanager";
import debugPrint, { debugExecute } from "../util/DebugPrint";
import { PCM } from "../util/PCM";

export type AudioTrackEvents = 'onTick' | 'onEnd' | 'onStart' | 'onReady' | 'onError';

export abstract class AAudioTrack {
	protected _title: string;
	protected _url: string;
	protected _duration: number;
	protected _thumbnail: string;
	protected _audio_buffer: Buffer;
	protected readonly _events: Map<AudioTrackEvents, AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>[]> = new Map<AudioTrackEvents, AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>[]>();
	abstract on(event: AudioTrackEvents, func: AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>): void;

	constructor(audio_buffer: Buffer, title?: string, url?: string, duration?: number, thumbnail?: string) {
		this._title = title;
		this._url = url;
		this._duration = duration;
		this._thumbnail = thumbnail;
		this._audio_buffer = audio_buffer;
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
	public get pcm(): Buffer {
		return this._audio_buffer;
	}
}

export class AudioTrackHusk extends AAudioTrack {

	constructor(audio_buffer: Buffer, title?: string, url?: string, duration?: number, thumbnail?: string) {
		super(audio_buffer, title, url, duration, thumbnail);
	}

	public cast(): AudioTrack {
		const audio_track = new AudioTrack(this._audio_buffer, this._title, this._url, this._duration, this._thumbnail);
		this._events.forEach((value, key) => {
			value.forEach((func) => {
				audio_track.on(key, func);
			});
		});
		return audio_track;
	}

	public on(event: AudioTrackEvents, func: AsyncFunction<AudioTrackEventsMap[AudioTrackEventsMapKeys], void>) {
		if (!this._events.has(event)) {
			this._events.set(event, []);
		}
		this._events.get(event).push(func);
	}

}

export class AudioTrack extends AAudioTrack {
	private _is_playing: boolean = false;
	private _audio_stream_opec: Buffer;
	private _audio_opec_packet_sizes: number[] = [];
	private _ready: boolean = false;

	/**
	 * @param audio_buffer The audio buffer to play, this must be in PCM format
	 */
	constructor(audio_buffer: Buffer, title?: string, url?: string, duration?: number, thumbnail?: string) {
		super(audio_buffer, title, url, duration, thumbnail);
		this.m_convertToOpus();
	}

	private async m_convertToOpus() {
		if (this._ready) return;
		[this._audio_stream_opec, this._audio_opec_packet_sizes] = await AudioTrack.m_encodeAudio(this._audio_buffer);
		this._ready = true;
	}

	public get opusPackets(): Buffer {
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
		this._is_playing = false;
		this.m_callEnd();
	}

	private m_callEnd() {
		this._events.get('onEnd')?.map((event: AsyncFunction<any, void>) => {
			event(null);
		});
	}

	//@ts-ignore
	public async static m_encodeAudio(audio_buffer: Buffer): Promise<[Buffer, number[]]> {
		const MAX_BUFFER_SIZE = PCM.getOpumSize(48000, 2, 20);		//max buffer size for opus encoding 
		const encoder = new OpusEncoder(48000, 2);
		const opus_buffer: Buffer = Buffer.alloc(audio_buffer.length);	//allocate buffer for opus encoding);
		const packet_sizes: number[] = [];
		let opus_index = 1;

		for (let i = 0; i < audio_buffer.length; i += MAX_BUFFER_SIZE) {
			let chunk = audio_buffer.slice(i, i + MAX_BUFFER_SIZE);
			try {
				debugPrint("info", `[AudioTrack] Attempting to encode audio chunk: ${chunk.length} bytes (Supposed to be ${MAX_BUFFER_SIZE})`);
				if (chunk.length < MAX_BUFFER_SIZE) {
					//extend chunk with 00 bytes until it is the right size
					const diff = MAX_BUFFER_SIZE - chunk.length;
					const diff_buffer = Buffer.alloc(diff);
					chunk = Buffer.concat([chunk, diff_buffer]);
				}
				const encoded_chunk = encoder.encode(chunk);
				encoded_chunk.copy(opus_buffer, opus_index - 1);
				debugPrint("info", "[AudioTrack] Encoded audio chunk: " + encoded_chunk.length + " bytes (" + chunk.length + " bytes raw)");
				opus_index += encoded_chunk.length;
				packet_sizes.push(encoded_chunk.length);
			} catch (err) {
				debugPrint("warn", "[AudioTrack] Failed to encode audio chunk: " + err);
			}
		}

		debugPrint("info", "[AudioTrack] Encoded audio buffer: " + opus_buffer.length + " bytes");
		debugPrint("info", "[AudioTrack] Encoded audio buffer: ", opus_buffer);
		debugPrint("info", "[AudioTrack] Encoded audio buffer packets: ", packet_sizes)

		return [opus_buffer, packet_sizes];
	}

	//play through the track opec and call the onTick event
	private async m_onTick() {
		//start track loop, this should progress through the track at the right speed
		let packet_index = 0;
		let buffer_index = 0;
		const packet_interval = 20;
		let last_timeout = packet_interval;
		const last_packet_time = new TimeDelta();

		const send_packet = async () => {
			while (!this._ready) { await (new Promise((resolve) => { setTimeout(() => { resolve(null); }, 100); })); }
			const packet_size = this._audio_opec_packet_sizes[packet_index];
			if (packet_size === undefined) {
				debugPrint("info", "[AudioTrack Tick] End of track");
				this.stop();
				return 0;
			}
			const packet = Buffer.alloc(packet_size);
			this._audio_stream_opec.copy(packet, 0, buffer_index, buffer_index + packet_size);
			buffer_index += packet_size;
			this._events.get('onTick').map((event: AsyncFunction<{ byte: Buffer }, void>) => {
				event({ byte: packet });
			});
			packet_index += 1;
			const delta_time = (last_packet_time.delta - last_timeout);
			debugExecute(() => {
				if (delta_time < 0)
					debugPrint("warn", "[AudioTrack Tick] Delta Time: %d ms (LATE)", delta_time);
			})
			last_packet_time.reset()
			return delta_time;
		}

		this._is_playing = true;
		while (this._is_playing) {
			const last_packet = await send_packet();
			await (new Promise(async (resolve) => {
				const reducer = last_packet;
				const timeout = (packet_interval) - reducer;
				last_timeout = timeout;

				if (last_timeout <= 0) {
					debugPrint("warn", "[AudioTrack Tick][WARNING LESSER] Delta Time: %d ms (LATE) (SKIPPING IMMINENT)", last_timeout);
					while (last_timeout <= 0) {
						debugPrint("warn", "[AudioTrack Tick] Tick is too late, trying to save face...")
						last_timeout += packet_interval;
						await send_packet();
					}
				} else if (last_timeout > 20) {
					debugPrint("warn", "[AudioTrack Tick][WARNING GREATER] Delta Time: %d ms (LATE) (SKIPPING POSSIBLE)", last_timeout);
					last_timeout = packet_interval;
				}

				setTimeout(() => {
					resolve(null);
				}, last_timeout);
				//debugPrint("[AudioTrack Tick] Next Base Interval: %d ms", last_timeout)
			}));
		}
	}

}


class TimeDelta {
	private _last_time: number = Date.now();

	public get delta(): number {
		const current_time = Date.now();
		const delta = current_time - this._last_time;
		this._last_time = current_time;
		return delta;
	}

	public reset(): void {
		this._last_time = Date.now();
	}
}
