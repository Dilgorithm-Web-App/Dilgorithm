/**
 * Adapter: normalizes server WebSocket payloads into UI-ready chat rows (LSP-safe shape).
 */
export function adaptChatEventPayload(serverMessage) {
    if (!serverMessage || typeof serverMessage !== 'object') return null;
    const id = serverMessage.id;
    if (id == null) return null;
    return {
        id,
        senderId: serverMessage.senderId,
        recipientId: serverMessage.recipientId,
        senderName: serverMessage.senderName,
        message: serverMessage.message,
        createdAt: serverMessage.createdAt,
    };
}
