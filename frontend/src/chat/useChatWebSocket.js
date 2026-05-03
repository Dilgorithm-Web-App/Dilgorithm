import { useCallback, useEffect, useRef, useState } from 'react';
import { createChatWebSocketClient } from './chatWebSocketFactory.js';
import { buildChatWebSocketUrl } from './ws/buildChatWebSocketUrl.js';
import { ConnectionState } from './ws/connectionState.js';

/**
 * React binding over ChatWebSocketClient (Observer + State surfaced to UI).
 */
export function useChatWebSocket({ roomName, accessToken, enabled, onMessage, onOpen, onError }) {
    const [connectionState, setConnectionState] = useState(ConnectionState.IDLE);
    const clientRef = useRef(null);
    const onMessageRef = useRef(onMessage);
    const onOpenRef = useRef(onOpen);
    const onErrorRef = useRef(onError);

    onMessageRef.current = onMessage;
    onOpenRef.current = onOpen;
    onErrorRef.current = onError;

    useEffect(() => {
        if (!enabled || !roomName || !accessToken) {
            setConnectionState(ConnectionState.IDLE);
            return undefined;
        }

        const url = buildChatWebSocketUrl(roomName, accessToken);
        const client = createChatWebSocketClient({ url });
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
    }, [enabled, roomName, accessToken]);

    const sendText = useCallback((text) => {
        return clientRef.current?.sendChatMessage(text) ?? false;
    }, []);

    return { connectionState, sendText };
}
