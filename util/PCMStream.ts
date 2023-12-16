import ffmpeg from "fluent-ffmpeg";
import debugPrint from "./DebugPrint";
import { Readable, Writable, Transform } from "stream";

export namespace PCM.Stream {


	//incoming_stream should be a stream, not a buffer so we can pipe it as it comes in
	export async function ffmpegToPCM(incoming_stream: Readable): Promise<Readable> {

		const AUDIO_CHANNELS = 2;
		const AUDIO_RATE = 48000;
		const AUDIO_BITRATE = 128;

		const finish_pipe = () => {
			debugPrint("info", "[PCM][FFMPEG] Buffer transformed successfully");
		}

		const ffpmeg_output = new Transform({
			transform(chunk, encoding, callback) {
				debugPrint("info", "[PCM][FFMPEG] Buffer transformed: " + chunk.length + " bytes");
				this.push(chunk);
				callback();
			}
		});
		await new Promise((resolve, reject) => {
			ffmpeg()
				.input(incoming_stream)
				.audioChannels(AUDIO_CHANNELS)
				.audioFrequency(AUDIO_RATE)
				.audioBitrate(AUDIO_BITRATE)
				.toFormat('wav')
				.on('end', () => {
					debugPrint("info", "[PCM][FFPMEG] END");
					finish_pipe();
				})
				.pipe(ffpmeg_output, { end: true });
		});

	}
}
