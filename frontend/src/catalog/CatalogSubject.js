/** Observer pattern: notify subscribers when catalog data is ready. */
export class CatalogSubject {
    constructor() {
        /** @type {Set<(data: unknown) => void>} */
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(payload) {
        this.listeners.forEach((listener) => listener(payload));
    }
}
