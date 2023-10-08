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
	const data = new SlashCommandBuilder()
		.setName(handle)
		.setDescription(description)
	return {
		data,
		async execute(interaction: any) {
			debugPrint("[INFO] Slash command received, interaction type : ", interaction.type);

			interaction.reply("✅ Slash command received");
		}
	}

}
