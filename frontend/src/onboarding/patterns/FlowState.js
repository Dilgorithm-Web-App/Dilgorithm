/** State pattern: step index is encapsulated; transitions return new state (immutable). */
class StepState {
    constructor(index, totalSteps) {
        this.index = index;
        this.totalSteps = totalSteps;
    }

    next() {
        const nextIndex = Math.min(this.index + 1, this.totalSteps - 1);
        return new StepState(nextIndex, this.totalSteps);
    }

    previous() {
        const prevIndex = Math.max(this.index - 1, 0);
        return new StepState(prevIndex, this.totalSteps);
    }

    value() {
        return this.index;
    }
}

export const getInitialState = (initialIndex = 0, totalSteps = 1) => {
    const safeTotal = Math.max(1, totalSteps);
    const safeIndex = Math.min(Math.max(initialIndex, 0), safeTotal - 1);
    return new StepState(safeIndex, safeTotal);
};
