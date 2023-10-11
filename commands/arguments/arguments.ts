import { Message } from "discord.js";
import debugPrint from "../../util/DebugPrint";

type IArgument<T extends string> = {
	[key in T]?: string;
}

export function ArgumentGrabber<T extends string>(message: Message, args_list: T[]) {
	const entire_message = message.content;
	//ignore first word	
	const args = entire_message.split(' ').slice(1);
	let arg_list: IArgument<T> = {};
	for (let i = 0; i < args.length; i++) {
		let label: string = '';
		if (args.length < i) {
			label += i;
		} else {
			label = args_list[i];
		}
		arg_list[label] = args[i];
	}
	debugPrint("info", "[ArgumentGrabber] Grabbed arguments: " + JSON.stringify(arg_list));
	return arg_list;
}

