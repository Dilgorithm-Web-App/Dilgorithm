/**
 * Singleton: single source for WebSocket origin (DIP — consumers depend on this module, not env parsing everywhere).
 */
let cachedOrigin = null;

export function getChatWebSocketOrigin() {
    if (cachedOrigin) return cachedOrigin;

    const explicit = import.meta.env.VITE_WS_BASE_URL;
    if (explicit) {
        cachedOrigin = String(explicit).replace(/\/$/, '');
        return cachedOrigin;
    }

    const api = import.meta.env.VITE_API_BASE_URL || '';
    if (api.startsWith('http')) {
        cachedOrigin = api.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
        return cachedOrigin;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    cachedOrigin = `${proto}//${window.location.hostname}:8000`;
    return cachedOrigin;
}

/** Test / HMR: reset cached origin */
export function resetChatWebSocketOriginForTests() {
    cachedOrigin = null;
}

/**
 * Singleton accessor: latest JWT for WebSocket auth (reads storage at call time — never stale).
 * DIP: inject a different `getToken` into ChatWebSocketClient for tests.
 */
export function getLatestAccessToken() {
    try {
        return localStorage.getItem('access_token') || '';
    } catch {
        return '';
    }
}
