import axios from "axios";

export async function getTempImage(base64: string | Buffer): Promise<string> {
	try {
		if (base64 instanceof Buffer) {
			base64 = (base64 as Buffer).toString();
		}
		const obj = {
			file: base64
		}
		const path = await axios.post('https://fofx.zip/ti/', obj);
		return path.data.path;
	} catch (e) {
		return "https://fofx.zip/liminality/images/placeholder.png"
	}

}
