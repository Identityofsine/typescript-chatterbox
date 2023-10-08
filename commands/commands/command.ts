import { SyncFunction } from '../../types/asyncfunction';

class Command<Args extends Record<any, any>, T> {
	private _name: string;
	private _description: string;
	private _options: any;
	private _callback: SyncFunction<Args, T>;

	public constructor(name: string, description: string, options: any, callback: SyncFunction<Args, T>) {
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

