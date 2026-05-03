/**
 * Singleton pattern: one shared notification-service instance for the session.
 *
 * Manages a toast queue and provides a simple `show(message, type)` API.
 * Pages subscribe via the Observer (EventBus) or call directly.
 *
 * SOLID:
 *   SRP — only manages toast state and dispatching.
 *   ISP — narrow API surface: show / subscribe / getLatest.
 */

import { eventBus } from './EventBus';

class NotificationService {
    constructor() {
        if (NotificationService._instance) {
            return NotificationService._instance;
        }
        /** @type {{ message: string, type: string, ts: number }[]} */
        this._queue = [];
        /** @type {Set<Function>} */
        this._listeners = new Set();
        NotificationService._instance = this;
    }

    /**
     * Display a toast notification.
     * @param {string} message
     * @param {'success'|'error'|'info'} [type='info']
     */
    show(message, type = 'info') {
        const entry = { message, type, ts: Date.now() };
        this._queue.push(entry);
        // Keep only last 20 toasts in memory
        if (this._queue.length > 20) this._queue.shift();
        this._listeners.forEach((fn) => fn(entry));
    }

    /**
     * Subscribe to new notifications.  Returns an unsubscribe function.
     * @param {Function} listener
     * @returns {() => void}
     */
    subscribe(listener) {
        this._listeners.add(listener);
        return () => this._listeners.delete(listener);
    }

    /** @returns {{ message: string, type: string, ts: number } | undefined} */
    getLatest() {
        return this._queue[this._queue.length - 1];
    }
}

/** Singleton instance (Singleton pattern). */
export const notificationService = new NotificationService();

// Wire default EventBus observers so any component can trigger toasts via events.
eventBus.subscribe('toast.show', (data) => {
    notificationService.show(data?.message || '', data?.type || 'info');
});

eventBus.subscribe('favorite.toggled', (data) => {
    notificationService.show(
        data?.isFavorite ? 'Added to favorites ♥' : 'Removed from favorites',
        'success',
    );
});

eventBus.subscribe('user.blocked', (data) => {
    notificationService.show(
        data?.isBlocked ? 'User blocked' : 'User unblocked',
        'info',
    );
});

eventBus.subscribe('report.submitted', () => {
    notificationService.show('Report submitted. Thank you.', 'success');
});

eventBus.subscribe('profile.saved', () => {
    notificationService.show('Profile saved successfully!', 'success');
});
