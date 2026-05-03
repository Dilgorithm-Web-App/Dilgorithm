import { useCallback, useEffect, useRef, useState } from 'react';
import { createChatWebSocketClient } from './chatWebSocketFactory.js';
import { getLatestAccessToken } from './ws/chatSocketConfig.js';
import { ConnectionState } from './ws/connectionState.js';

/**
 * React binding over ChatWebSocketClient (Observer + State).
 * DIP: optional getToken ref — defaults to singleton getLatestAccessToken (no stale closure on token).
 * Effect deps: only room + enabled — reconnects always re-read storage inside the client.
 */
export function useChatWebSocket({ roomName, enabled, onMessage, onOpen, onError, getToken }) {
    const [connectionState, setConnectionState] = useState(ConnectionState.IDLE);
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onErrorRef = useRef(onError);
    const getTokenRef = useRef(getToken ?? getLatestAccessToken);

    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;
    getTokenRef.current = getToken ?? getLatestAccessToken;

    useEffect(() => {
        if (!enabled || !roomName) {
            setConnectionState(ConnectionState.IDLE);
            return undefined;
        }

        const client = createChatWebSocketClient({
            roomName,
            getToken: () =>
                typeof getTokenRef.current === 'function' ? getTokenRef.current() : getLatestAccessToken(),
        });
        clientRef.current = client;

        const unsub = client.subscribe((evt) => {
            if (evt.type === 'state') setConnectionState(evt.state);
            if (evt.type === 'message' && onMessageRef.current) onMessageRef.current(evt.payload);
            if (evt.type === 'open' && onOpenRef.current) onOpenRef.current();
            if (evt.type === 'error' && onErrorRef.current) onErrorRef.current(evt.detail || '');
        });

        client.connect();

        return () => {
            unsub();
            client.dispose();
            clientRef.current = null;
        };
    }, [enabled, roomName]);

    const sendText = useCallback((text) => {
        return clientRef.current?.sendChatMessage(text) ?? false;
    }, []);

    return { connectionState, sendText };
}
