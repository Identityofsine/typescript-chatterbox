export namespace URL {

	//valid urls/srcs
	type ValidURLSource = "youtube" | "soundcloud"

	//isvalidurl 10/22/23
	export function isValidURL(str: string) {
		const urlRegex = /^(ftp|http|https):\/\/[^ "]+$/;
		return urlRegex.test(str);
	}
}
