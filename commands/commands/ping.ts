import { Guild, Message } from "discord.js";
import Command from "./command";

const ping = new Command<Message, void>("ping", "Pong!", {}, ({ props, guild }) => {
	props.channel.send("Pong!");
});

export { ping };

