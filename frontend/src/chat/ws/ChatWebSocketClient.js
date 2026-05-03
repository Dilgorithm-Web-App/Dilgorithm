import { adaptChatEventPayload } from './adaptChatServerMessage.js';
import { ConnectionState } from './connectionState.js';
import { createBackoffIterator } from './exponentialBackoff.js';
import { createInboundMessageComposite } from './inboundMessageComposite.js';
import { SimpleEventSubject } from './SimpleEventSubject.js';

/**
 * Façade + Template-method style lifecycle (_connectNow → _handleOpen / _handleClose).
 * DIP: WebSocketImpl injectable for tests.
 */
export class ChatWebSocketClient {
    /**
     * @param {{ url: string, WebSocketImpl?: typeof WebSocket }} options
     */
    constructor({ url, WebSocketImpl = WebSocket }) {
        this.url = url;
        this.WebSocketImpl = WebSocketImpl;
        this._events = new SimpleEventSubject();
        this._ws = null;
        this._intended = false;
        this._backoff = createBackoffIterator();
        this._reconnectTimer = null;
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

    _emitState(state) {
        this._events.notify({ type: 'state', state });
    }

    _connectNow() {
        if (!this._intended) return;
        this._teardownSocket();
        this._emitState(ConnectionState.CONNECTING);
        try {
            const ws = new this.WebSocketImpl(this.url);
            this._ws = ws;
            ws.onopen = () => this._handleOpen();
            ws.onmessage = (ev) => this._dispatchInbound(ev.data);
            ws.onerror = () => {
                this._emitState(ConnectionState.ERROR);
            };
            ws.onclose = (ev) => this._handleClose(ev);
        } catch {
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
        if (ev.code === 4001 || ev.code === 4002 || ev.code === 4003) {
            this._intended = false;
            this._emitState(ConnectionState.CLOSED);
            this._events.notify({
                type: 'error',
                detail: 'Could not authenticate or open this chat room.',
            });
            return;
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
