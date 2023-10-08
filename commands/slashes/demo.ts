import debugPrint from "../../util/DebugPrint";
import { slashFactory } from "../SlashFactory";

export default slashFactory({
	handle: "demo",
	description: "A demo slash command",
	options: [],
	callback: async (interaction) => {
		debugPrint("[DEBUG] Demo slash command called, interaction type: ", interaction.type);
		await interaction.reply("Hello World!");
	}
});
