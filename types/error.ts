
export class DiscordBotError extends Error {
	constructor(message?: string) {
		super(message);
		this.name = 'BotError';
	}
}
