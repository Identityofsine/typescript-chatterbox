export namespace PCM {
	export function isValidPCM(audio_buffer: Buffer): boolean {
		return audio_buffer.length % 2 === 0;
	};

	export function getOpumSize(rate: number, channels: number, ms: number = 2.5): number {
		const frame_size = (rate / 1000) * ms;
		const required_buffer_size = frame_size * channels * 2; // 2 bytes per sample (16-bit audio)
		return required_buffer_size;
	};
}
