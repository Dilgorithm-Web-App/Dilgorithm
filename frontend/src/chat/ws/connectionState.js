/** State: explicit connection phases for the WebSocket lifecycle. */
export const ConnectionState = Object.freeze({
    IDLE: 'idle',
    CONNECTING: 'connecting',
    OPEN: 'open',
    RECONNECTING: 'reconnecting',
    CLOSED: 'closed',
    ERROR: 'error',
});
