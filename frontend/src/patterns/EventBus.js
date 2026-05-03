/**
 * Observer pattern (dashboard layer): lightweight publish / subscribe event bus.
 *
 * Components publish domain events and any number of subscribers react,
 * without the publisher knowing about its consumers (Open/Closed Principle).
 *
 * Usage:
 *   import { eventBus } from '../patterns/EventBus';
 *   const unsub = eventBus.subscribe('favorite.toggled', handler);
 *   eventBus.publish('favorite.toggled', { userId: 42, isFavorite: true });
 *   unsub();   // cleanup
 *
 * SOLID:
 *   SRP  — this module only manages event routing.
 *   OCP  — new event types need zero changes here.
 *   DIP  — publishers & subscribers depend on the bus contract, not each other.
 */

class EventBus {
    constructor() {
        /** @type {Map<string, Set<Function>>} */
        this._subscribers = new Map();
    }

    /**
     * Subscribe to an event. Returns an unsubscribe function.
     * @param {string} eventName
     * @param {Function} handler
     * @returns {() => void}
     */
    subscribe(eventName, handler) {
        if (!this._subscribers.has(eventName)) {
            this._subscribers.set(eventName, new Set());
        }
        this._subscribers.get(eventName).add(handler);
        return () => this._subscribers.get(eventName)?.delete(handler);
    }

    /**
     * Publish an event with optional payload.
     * @param {string} eventName
     * @param {*} [data]
     */
    publish(eventName, data) {
        const handlers = this._subscribers.get(eventName);
        if (!handlers) return;
        handlers.forEach((fn) => {
            try {
                fn(data);
            } catch (err) {
                console.error(`[EventBus] handler error for "${eventName}":`, err);
            }
        });
    }
}

/** Singleton event bus instance (Observer pattern). */
export const eventBus = new EventBus();
