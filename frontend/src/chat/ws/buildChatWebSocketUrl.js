import { getChatWebSocketOrigin } from './chatSocketConfig';

/**
 * Factory: builds authenticated WS URL for a Dilgorithm chat room.
 * @param {string} roomName e.g. room_12
 * @param {string} accessToken JWT access token
 */
export function buildChatWebSocketUrl(roomName, accessToken) {
    const origin = getChatWebSocketOrigin();
    const enc = encodeURIComponent(accessToken || '');
    return `${origin}/ws/chat/${roomName}/?token=${enc}`;
}
