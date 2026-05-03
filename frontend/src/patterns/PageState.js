/**
 * State pattern: immutable page-state for async flows (loading/loaded/error/saving).
 * Encapsulates transitions so components don't manage raw string states.
 * SOLID: SRP — only manages page state transitions. OCP — add states via subclass.
 */
export class PageState {
    constructor(status, data = null, error = null) {
        this.status = status;
        this.data = data;
        this.error = error;
        Object.freeze(this);
    }
    get isLoading() { return this.status === 'loading'; }
    get isLoaded() { return this.status === 'loaded'; }
    get isError() { return this.status === 'error'; }
    get isSaving() { return this.status === 'saving'; }
    get isIdle() { return this.status === 'idle'; }

    static idle() { return new PageState('idle'); }
    static loading() { return new PageState('loading'); }
    static loaded(data) { return new PageState('loaded', data); }
    static error(err) { return new PageState('error', null, err); }
    static saving(data) { return new PageState('saving', data); }

    /** Transition helpers — return new states (immutable). */
    toLoading() { return PageState.loading(); }
    toLoaded(data) { return PageState.loaded(data); }
    toError(err) { return PageState.error(err); }
    toSaving() { return PageState.saving(this.data); }
    toIdle() { return PageState.idle(); }
}
