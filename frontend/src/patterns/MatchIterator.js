/**
 * Iterator pattern: sequential traversal over match lists without exposing internals.
 * SOLID: SRP — only handles traversal. ISP — narrow API (next/current/hasMore/reset).
 */
export class MatchIterator {
    constructor(items = []) {
        this._items = items;
        this._index = 0;
    }
    current() { return this._items[this._index]; }
    next() { if (this._index < this._items.length - 1) this._index++; return this.current(); }
    hasMore() { return this._index < this._items.length - 1; }
    reset() { this._index = 0; return this; }
    isFirst() { return this._index === 0; }
    isLast() { return this._index === this._items.length - 1; }
    toArray() { return [...this._items]; }
    get length() { return this._items.length; }

    /** Iterate with a callback (like forEach but using the iterator protocol). */
    forEach(fn) {
        this.reset();
        for (let i = 0; i < this._items.length; i++) {
            fn(this._items[i], i);
        }
    }
}
