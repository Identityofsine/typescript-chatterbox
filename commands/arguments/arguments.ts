import { Message } from "discord.js";
import debugPrint from "../../util/DebugPrint";

type IArgument<T extends string> = {
	[key in T]?: string;
}

export function ArgumentGrabber<T extends string>(message: Message, args_list: T[]) {
	const entire_message = message.content;
	//ignore first word	
	const args = entire_message.split(' ').slice(1);
	//find words that have "--" at the beginning
	const force_args = args.filter((arg) => arg.startsWith('--'));

	let arg_list: IArgument<T> = {};
	for (let i = 0; i < args.length; i++) {
		if (args[i].startsWith('--')) {
			const arg = args[i].replace('--', '');
			if (i + 1 >= args.length) {
				continue;
			} else {
				if (args[i + 1].startsWith('--')) {

					continue;
				}
				arg_list[arg] = args[i + 1];
				i++;
				continue;
			}
		}
		let label: string = '';
		if (args.length < i) {
			label += i;
		} else {
			label = args_list[i];
		}
		arg_list[label] = args[i];
	}

	for (let i = 0; i < force_args.length; i++) {
		const arg = force_args[i];
		let arg_found: string = '';
		arg_found = arg.replace('--', '');
		debugPrint("info", "[ArgumentGrabber] Found forced argument: " + arg_found);
		if (args_list.includes(arg_found as T))
			continue;
		arg_list[arg_found] = true;
	}

	debugPrint("info", "[ArgumentGrabber] Grabbed arguments: " + JSON.stringify(arg_list));
	return arg_list;
}

