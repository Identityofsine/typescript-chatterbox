import { axios_instance } from "./api";

export async function loadMedia(url: string) {
	const placeholder = "https://fofx.zip/liminality/images/placeholder.png";
	try {
		// Fetch the image data
		const response = await axios_instance.get(url, {
			responseType: 'arraybuffer' // Ensure response is treated as binary data
		});

		// Convert image data to base64
		const base64Image = Buffer.from(response.data, 'binary').toString('base64');

		// Format base64 string to be used in HTML <img> tag
		const formattedBase64 = `data:${response.headers['content-type']};base64,${base64Image}`;

		return formattedBase64;
	} catch (error) {
		console.error('[loadMedia]Error fetching image: ', 'Possible 404 ');
		return placeholder;
	}
}
