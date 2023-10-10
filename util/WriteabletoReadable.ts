import { Readable, Writable, Transform } from 'stream'
import debugPrint from './DebugPrint';

export async function CastWriteableToReadable(writable_stream: Writable): Promise<Readable> {
	return new Promise((resolve, _reject) => {
		debugPrint("[CastWriteableToReadable] Casting writable stream to readable stream");
		const buffer_array: Buffer[] = [];
		const buffer_transform = new Transform({
			transform(chunk, _encoding, callback) {
				//When the writable stream writes data, buffer 
				debugPrint("[CastWriteableToReadable] Buffering data: " + chunk.length + " bytes");
				buffer_array.push(chunk);
				callback();
			},
			flush(callback) {
				debugPrint("[CastWriteableToReadable] Pushing buffer to readable stream");
				//When the writable stream ends, push the beuffered data as a readable stream
				const readable_stream: Readable = new Readable({
					read() {
						for (const chunk of buffer_array) {
							this.push(chunk);
						}
						this.push(null);
					}
				});
				resolve(readable_stream);
				callback();
			},
		});
		buffer_transform.on('error', (err) => {
			debugPrint("[CastWriteableToReadable] Buffer transform: " + err);
			_reject(err);
		});
		writable_stream.pipe(buffer_transform);
		writable_stream.on('data', (chunk) => {
			debugPrint("[CastWriteableToReadable] Writable stream: " + chunk.length + " bytes");
		});
		writable_stream.on('error', (err) => {
			debugPrint("[CastWriteableToReadable] Writable stream: " + err);
			_reject(err);
		});
	});
}
