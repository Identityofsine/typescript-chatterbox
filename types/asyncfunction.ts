export type AsyncFunction<Args extends Record<any, any>, T extends any> = (args: Args) => Promise<T>;
export type SyncFunction<Args extends Record<any, any>, T extends any> = (args: Args) => T;
