/** Iterator pattern: sequential access over ONBOARDING_STEPS without exposing internals. */
export class StepIterator {
    constructor(steps, startIndex = 0) {
        this.steps = steps;
        this.index = startIndex;
    }

    current() {
        return this.steps[this.index];
    }

    next() {
        if (this.index < this.steps.length - 1) {
            this.index += 1;
        }
        return this.current();
    }

    previous() {
        if (this.index > 0) {
            this.index -= 1;
        }
        return this.current();
    }

    isFirst() {
        return this.index === 0;
    }

    isLast() {
        return this.index === this.steps.length - 1;
    }
}
