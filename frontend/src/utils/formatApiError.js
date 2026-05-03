/**
 * Turn an axios-style error into a user-visible string (DRF detail, network, status).
 *
 * SOLID: SRP — this module only normalises transport/API errors to display text.
 * OCP — extend by adding branches for new `data` shapes without changing callers’ contracts.
 * DIP — pages depend on this helper instead of reaching into axios internals everywhere.
 */
export function formatApiError(err, fallback = 'Something went wrong.') {
    if (!err?.response) {
        if (err?.message === 'Network Error') {
            return 'Cannot reach the server. Is the API running (e.g. http://127.0.0.1:8000) and the app using the Vite proxy or VITE_API_BASE_URL?';
        }
        return err?.message || fallback;
    }
    const { data, status } = err.response;
    if (typeof data?.detail === 'string') return data.detail;
    if (Array.isArray(data?.detail)) {
        return data.detail.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
    }
    if (data && typeof data === 'object' && data.detail && typeof data.detail === 'object') {
        try {
            return JSON.stringify(data.detail);
        } catch {
            /* ignore */
        }
    }
    if (typeof data === 'string' && data.trim()) return data;
    if (status) return `Request failed (${status}).`;
    return fallback;
}
