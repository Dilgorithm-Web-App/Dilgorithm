/** Observer pattern: progress listeners subscribe; subject notifies on change. */
class ProgressSubject {
    constructor() {
        this.listeners = new Set();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(progress) {
        this.listeners.forEach((listener) => listener(progress));
    }
}

export const progressSubject = new ProgressSubject();
