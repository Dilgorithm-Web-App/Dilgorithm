/**
 * State pattern: explicit catalog load lifecycle (idle → loading → ready).
 * Keeps transition vocabulary centralized for future guards / UI.
 */
export const CatalogLoadState = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
});
