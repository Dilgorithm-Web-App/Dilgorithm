/**
 * Composite: run multiple inbound handlers until one consumes the message (OCP — add handlers without changing parser).
 * @param {Array<(data: object) => boolean|void>} handlers return false to stop the chain
 */
export function createInboundMessageComposite(handlers) {
    return (rawString) => {
        let data;
        try {
            data = JSON.parse(rawString);
        } catch {
            return;
        }
        if (!data || typeof data !== 'object') return;
        for (const h of handlers) {
            if (h(data) === false) break;
        }
    };
}
