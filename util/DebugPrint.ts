import minimist from "minimist";

let isDebug = false;
let args = minimist(process.argv.slice(2));
if (args.d) {
	isDebug = true;
	console.log("[DEBUG] Debug mode enabled");
}

export { isDebug };

export default function debugPrint(...args: any[]) {
	if (isDebug)
		console.log(...args);
}

export function debugExecute(func: Function) {
	if (isDebug)
		func();
}
