import { User, Guild } from "discord.js";

export default (user: User, guild: Guild) => {
	return guild.members.cache.find(member => member.id === user.id);
}
