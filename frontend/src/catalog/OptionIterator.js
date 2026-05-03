/**
 * Iterator pattern over homogeneous option strings (e.g. filter dropdown values).
 */
export class OptionIterator {
    constructor(items = []) {
        this.items = Array.isArray(items) ? [...items] : [];
        this.cursor = 0;
    }

    next() {
        if (this.cursor >= this.items.length) {
            return { done: true, value: undefined };
        }
        const value = this.items[this.cursor];
        this.cursor += 1;
        return { done: false, value };
    }

    reset() {
        this.cursor = 0;
    }

    [Symbol.iterator]() {
        let i = 0;
        const items = this.items;
        return {
            next() {
                if (i >= items.length) return { done: true };
                return { done: false, value: items[i++] };
            },
        };
    }
}
