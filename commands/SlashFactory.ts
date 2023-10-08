import { SlashCommandBuilder } from "discord.js";
import { AsyncFunction } from "../types/asyncfunction";
import debugPrint from "../util/DebugPrint";

interface ISlashFactory {
	handle: string,
	description: string,
	options: any,
	callback: AsyncFunction<any, any>;
}


export function slashFactory({ handle, description, options, callback }: ISlashFactory) {
	debugPrint("[DEBUG: ℹ️] Slash command factory called, handle: ", handle, ", description: ", description, ", options: ", options, ", callback: ", callback);
	const data = new SlashCommandBuilder()
		.setName(handle)
		.setDescription(description)
	return {
		data: data,
		execute: callback,
	}

}
