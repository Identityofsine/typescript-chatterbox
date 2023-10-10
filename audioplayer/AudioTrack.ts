import { AsyncFunction } from "../types/asyncfunction";

export type AudioTrackEvents = 'onTick' | 'onEnd' | 'onStart';

export class AudioTrack {
	private _title: string;
	private _url: string;
	private _duration: number;
	private _thumbnail: string;
	private _events: Map<String, AsyncFunction<any, void>[]> = new Map<String, AsyncFunction<any, void>[]>();
	private _is_playing: boolean = false;
	private _audio_buffer: Buffer;

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


	public start(): void {

	}

	public stop(): void {

	}

	//play through the track opec and call the onTick event
	private async m_onTick() {
		//start track loop, this should progress through the track at the right speed
		while (this._is_playing) {
			const event_param = null;
			this._events.get('onTick').map((event: AsyncFunction<any, void>) => {
				event(event_param);
			});
		}
	}

}
