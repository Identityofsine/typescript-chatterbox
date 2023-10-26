import debugPrint from "./DebugPrint";
import { PCM } from "./PCM";

export namespace TTS {


	const ENDPOINT = 'https://tiktok-tts.weilnet.workers.dev';

	// TTS Voices
	export type TiktokVoices = 'en_us_001' | 'en_us_ghostface' | 'en_us_006';
	type TiktokVoiceChoice = 'female' | 'male' | 'ghostface';


	type TikTokTTSOptions = { [key in TiktokVoiceChoice]: TiktokVoices };

	export const TikTokTTSVoices: TikTokTTSOptions = {
		'female': 'en_us_001',
		'male': 'en_us_006',
		'ghostface': 'en_us_ghostface'
	}

	export async function getTTS(voice: TiktokVoices, text: string): Promise<Buffer> {
		//post request to tiktok tts api
		try {

			const post_data = {
				voice: voice,
				text: text
			}

			//post request with voice and text
			const response = await fetch(`${ENDPOINT}/api/generation`, {
				headers: {
					'Content-Type': 'application/json'
				},

				method: 'POST',
				body: JSON.stringify(post_data)
			});


			//get response data into json
			const response_data = await response.json();

			//check if response is null
			if (response_data?.data === null) {
				throw new Error('TTS API returned null');
			} else {
				//convert base64 to buffer
				const buffer = Buffer.from(response_data?.data, 'base64');
				return await PCM.ffpmegToPCM(buffer);
			}
		}
		catch (err) {
			debugPrint('error', '[TTS] Error getting TTS: ' + err);
		}

	}

}
