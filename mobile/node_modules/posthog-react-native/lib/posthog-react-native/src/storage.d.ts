import { PostHogCustomStorage } from './types';
type PostHogStorageContents = {
    [key: string]: any;
};
export declare class PostHogRNStorage {
    memoryCache: PostHogStorageContents;
    storage: PostHogCustomStorage;
    preloadPromise: Promise<void> | undefined;
    constructor(storage: PostHogCustomStorage);
    persist(): void;
    getItem(key: string): any | null | undefined;
    setItem(key: string, value: any): void;
    removeItem(key: string): void;
    clear(): void;
    getAllKeys(): readonly string[];
    populateMemoryCache(res: string | null): void;
}
export declare class PostHogRNSyncMemoryStorage extends PostHogRNStorage {
    constructor();
}
export {};
