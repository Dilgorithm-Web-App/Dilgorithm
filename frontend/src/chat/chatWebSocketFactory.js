import { ChatWebSocketClient } from './ws/ChatWebSocketClient.js';

/** Factory: centralizes construction (OCP — swap implementation without editing call sites). */
export function createChatWebSocketClient(options) {
    return new ChatWebSocketClient(options);
}
