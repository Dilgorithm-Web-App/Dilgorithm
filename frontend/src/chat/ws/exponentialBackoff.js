/**
 * Iterator: yields backoff delays (ms) for reconnection (exponential cap).
 */
export function createBackoffIterator({ initialMs = 1000, factor = 2, maxMs = 30000 } = {}) {
    let next = initialMs;
    return {
        next() {
            const value = Math.min(next, maxMs);
            next = Math.min(next * factor, maxMs);
            return { value, done: false };
        },
        reset() {
            next = initialMs;
        },
    };
}
