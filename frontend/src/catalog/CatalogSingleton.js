import { CatalogSubject } from './CatalogSubject';
import { createCatalogLoader } from './factory/catalogLoaderFactory';
import { CatalogLoadState } from './states/CatalogLoadState';

/**
 * Singleton facade over catalog loading + Observer broadcasts.
 * SRP: cache + orchestration only; fetching delegated to composite (ISP).
 */
class CatalogSingleton {
    static #instance = null;

    static getInstance() {
        if (!CatalogSingleton.#instance) {
            CatalogSingleton.#instance = new CatalogSingleton();
        }
        return CatalogSingleton.#instance;
    }

    constructor() {
        this.subject = new CatalogSubject();
        /** @type {{ filters: { locations: string[], sects: string[], caste: string[], education: string[] }, interests: string[] } | null} */
        this.snapshot = null;
        /** @type {Promise<unknown>|null} */
        this.loadPromise = null;
        this.loadState = CatalogLoadState.IDLE;
    }

    getSnapshot() {
        return this.snapshot;
    }

    subscribe(listener) {
        return this.subject.subscribe(listener);
    }

    /**
     * @param {import('axios').AxiosInstance} apiClient
     */
    async ensureLoaded(apiClient) {
        if (this.snapshot) return this.snapshot;
        if (!this.loadPromise) {
            this.loadState = CatalogLoadState.LOADING;
            const loader = createCatalogLoader(apiClient);
            this.loadPromise = loader
                .load()
                .then((data) => {
                    this.snapshot = data;
                    this.loadState = CatalogLoadState.READY;
                    this.subject.notify(data);
                    return data;
                })
                .finally(() => {
                    this.loadPromise = null;
                    if (!this.snapshot) this.loadState = CatalogLoadState.IDLE;
                });
        }
        return this.loadPromise;
    }

    /** Testing / forced reload hooks */
    reset() {
        this.snapshot = null;
        this.loadPromise = null;
        this.loadState = CatalogLoadState.IDLE;
    }
}

export const catalogSingleton = CatalogSingleton.getInstance();
