/**
 * Observer: minimal pub/sub for WebSocket façade events (ISP — small subscriber surface).
 */
export class SimpleEventSubject {
    constructor() {
        /** @type {Set<(evt: import('./wsEventTypes').WsClientEvent) => void>} */
        this._listeners = new Set();
    }

    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    notify(event) {
        this._listeners.forEach((fn) => {
            try {
                fn(event);
            } catch {
                /* isolate subscriber errors */
            }
        });
    }
}
