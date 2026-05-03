import { adaptChatEventPayload } from './adaptChatServerMessage.js';
import { buildChatWebSocketUrl } from './buildChatWebSocketUrl.js';
import { getLatestAccessToken } from './chatSocketConfig.js';
import { ConnectionState } from './connectionState.js';
import { createBackoffIterator } from './exponentialBackoff.js';
import { createInboundMessageComposite } from './inboundMessageComposite.js';
import { SimpleEventSubject } from './SimpleEventSubject.js';

/**
 * Single active socket per instance (Singleton of the native WebSocket handle for this session).
 * Template-method lifecycle: _connectNow → _handleOpen / _handleClose.
 * DIP: inject getToken + WebSocketImpl; URL built at connect time only (no stale token).
 */
export class ChatWebSocketClient {
    /**
     * @param {{
     *   roomName: string,
     *   getToken?: () => string,
     *   WebSocketImpl?: typeof WebSocket
     * }} options
     */
    constructor({ roomName, getToken = getLatestAccessToken, WebSocketImpl = WebSocket }) {
        this.roomName = roomName;
        this.getToken = getToken;
        this.WebSocketImpl = WebSocketImpl;
        this._events = new SimpleEventSubject();
        this._ws = null;
        this._intended = false;
        this._backoff = createBackoffIterator();
        this._reconnectTimer = null;
        /** Single-flight: avoid overlapping open attempts for the same logical session */
        this._opening = false;
        this._emitState(ConnectionState.IDLE);

        this._dispatchInbound = createInboundMessageComposite([
            (data) => {
                if (data.type === 'error') {
                    this._events.notify({
                        type: 'error',
                        detail: data.detail || 'Server error',
                    });
                    return false;
                }
                return true;
            },
            (data) => {
                if (data.type === 'chat.event' && data.message) {
                    const row = adaptChatEventPayload(data.message);
                    if (row) this._events.notify({ type: 'message', payload: row });
                    return false;
                }
                return true;
            },
        ]);
    }

    subscribe(listener) {
        return this._events.subscribe(listener);
    }

    connect() {
        this._intended = true;
        this._backoff.reset();
        clearTimeout(this._reconnectTimer);
        this._connectNow();
    }

    dispose() {
        this._intended = false;
        clearTimeout(this._reconnectTimer);
        this._opening = false;
        this._teardownSocket();
        this._emitState(ConnectionState.CLOSED);
    }

    /**
     * @param {string} text
     * @returns {boolean}
     */
    sendChatMessage(text) {
        if (!this._ws || this._ws.readyState !== this.WebSocketImpl.OPEN) return false;
        this._ws.send(JSON.stringify({ type: 'chat.message', message: text }));
        return true;
    }

    /** Factory-style URL resolution: always uses token from getToken() at call time */
    _resolveWebSocketUrl() {
        const token = typeof this.getToken === 'function' ? this.getToken() : '';
        if (!token) return null;
        return buildChatWebSocketUrl(this.roomName, token);
    }

    _emitState(state) {
        this._events.notify({ type: 'state', state });
    }

    _connectNow() {
        if (!this._intended || this._opening) return;

        const url = this._resolveWebSocketUrl();
        if (!url) {
            this._emitState(ConnectionState.RECONNECTING);
            this._scheduleReconnect();
            return;
        }

        this._opening = true;
        this._teardownSocket();
        this._emitState(ConnectionState.CONNECTING);
        try {
            const ws = new this.WebSocketImpl(url);
            this._ws = ws;
            ws.onopen = () => {
                this._opening = false;
                this._handleOpen();
            };
            ws.onmessage = (ev) => this._dispatchInbound(ev.data);
            ws.onerror = () => {
                this._emitState(ConnectionState.ERROR);
            };
            ws.onclose = (ev) => {
                this._opening = false;
                this._handleClose(ev);
            };
        } catch {
            this._opening = false;
            this._emitState(ConnectionState.ERROR);
            this._scheduleReconnect();
        }
    }

    _handleOpen() {
        this._backoff.reset();
        this._emitState(ConnectionState.OPEN);
        this._events.notify({ type: 'open' });
    }

    _handleClose(ev) {
        this._teardownSocket(false);
        if (!this._intended) {
            this._emitState(ConnectionState.CLOSED);
            return;
        }
        /**
         * Auth / room errors may be transient (e.g. expired access token). Reconnect so a token
         * refreshed by axios can be picked up on the next open without a full page reload.
         */
        if (ev.code === 4001 || ev.code === 4002 || ev.code === 4003) {
            this._events.notify({
                type: 'error',
                detail: 'Reconnecting with latest session…',
            });
        }
        this._scheduleReconnect();
    }

    _scheduleReconnect() {
        if (!this._intended) return;
        this._emitState(ConnectionState.RECONNECTING);
        const { value } = this._backoff.next();
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = setTimeout(() => this._connectNow(), value);
    }

    _teardownSocket(shouldClose = true) {
        if (!this._ws) return;
        const ws = this._ws;
        this._ws = null;
        ws.onopen = null;
        ws.onmessage = null;
        ws.onerror = null;
        ws.onclose = null;
        if (
            shouldClose &&
            (ws.readyState === this.WebSocketImpl.CONNECTING ||
                ws.readyState === this.WebSocketImpl.OPEN)
        ) {
            try {
                ws.close();
            } catch {
                /* ignore */
            }
        }
    }
}
