import minimist from "minimist";

let isDebug = false;
let args = minimist(process.argv.slice(2));
if (args.d) {
	isDebug = true;
	console.log("[DEBUG] Debug mode enabled");
}

export { isDebug };

export type DebugTypes = "info" | "warn" | "error" | "log";

export default function debugPrint(type: DebugTypes = "log", ...args: any[]) {
	const assignEmoji = (type: DebugTypes) => {
		return type === "info" ? "i" : type === "warn" ? "⚠️" : type === "error" ? "❌" : "";
	}

	if (isDebug) {
		console.log(`[${assignEmoji(type)}][DEBUG]`);
		console.log(...args);
	}
}

export function debugExecute(func: Function) {
	if (isDebug)
		func();
}
