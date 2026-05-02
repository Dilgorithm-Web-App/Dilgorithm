class StepState {
    constructor(index) {
        this.index = index;
    }

    next() {
        return FLOW_STATES[Math.min(this.index + 1, FLOW_STATES.length - 1)];
    }

    previous() {
        return FLOW_STATES[Math.max(this.index - 1, 0)];
    }

    value() {
        return this.index;
    }
}

class Step1LocationState extends StepState {
    constructor() { super(0); }
}
class Step2ProfessionState extends StepState {
    constructor() { super(1); }
}
class Step3EducationState extends StepState {
    constructor() { super(2); }
}
class Step4SectState extends StepState {
    constructor() { super(3); }
}
class Step5FinalState extends StepState {
    constructor() { super(4); }
}

const FLOW_STATES = [
    new Step1LocationState(),
    new Step2ProfessionState(),
    new Step3EducationState(),
    new Step4SectState(),
    new Step5FinalState(),
];

export const getInitialState = () => FLOW_STATES[0];
