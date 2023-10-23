import ffmpeg from "fluent-ffmpeg";
import debugPrint from "./DebugPrint";
import { Readable, Writable, Transform } from "stream";

export namespace PCM {
	export function isValidPCM(audio_buffer: Buffer): boolean {
		return audio_buffer.length % 2 === 0;
	};

	export function getOpumSize(rate: number, channels: number, ms: number = 2.5): number {
		const frame_size = (rate / 1000) * ms;
		const required_buffer_size = frame_size * channels * 2; // 2 bytes per sample (16-bit audio)
		return required_buffer_size;
	};

	export async function ffpmegToPCM(incoming_stream: Readable): Promise<Buffer> {

		const finish_pipe = () => {
			debugPrint("info", "[Youtube][FFPMEG] Buffer transformed successfully");
		}

		const ffpmeg_output = new Transform({
			transform(chunk, encoding, callback) {
				debugPrint("info", "[Youtube] Buffer transformed: " + chunk.length + " bytes");
				this.push(chunk);
				callback();
			}
		});
		const temp_pipe = new Writable({
			write(chunk, encoding, callback) {
				debugPrint("info", "[Youtube][FFPMEG] Buffer received: " + chunk.length + " bytes");
				ffpmeg_output.push(chunk);
				callback();
			},
			final(callback) {
				callback();
			}
		});

		const pcm_buffer: Buffer = await (new Promise((resolve, reject) => {
			ffmpeg()
				.input(incoming_stream)
				.audioChannels(2)
				.toFormat('wav')
				.on('end', () => {
					debugPrint("info", "[PCM][FFPMEG] END");
					finish_pipe();
					resolve(ffpmeg_output.read());
				})
				.on('error', (err) => {
					debugPrint("error", "[PCM][FFPMEG] Error: " + err);
					reject(err);
				})
				.pipe(temp_pipe, { end: true })
		}));

		return pcm_buffer;
	}

}
