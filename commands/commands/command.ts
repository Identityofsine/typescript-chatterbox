import { Guild } from 'discord.js';
import { AsyncFunction } from '../../types/asyncfunction';

type CommandGenericFunction<Args extends Record<any, any>, T> = AsyncFunction<{ props: Args } & { guild: Guild }, T>;

class Command<Args extends Record<any, any>, T> {
	private _name: string;
	private _description: string;
	private _options: any;
	private _callback: CommandGenericFunction<Args, T>;

	public constructor(name: string, description: string, options: any, callback: CommandGenericFunction<Args, T>) {
		this._name = name;
		this._description = description;
		this._options = options;
		this._callback = callback;
	}

	get name(): string {
		return this._name;
	}

	get description(): string {
		return this._description;
	}

	get options(): any {
		return this._options;
	}

	get callback(): any {
		return this._callback;
	}

}

export default Command;

