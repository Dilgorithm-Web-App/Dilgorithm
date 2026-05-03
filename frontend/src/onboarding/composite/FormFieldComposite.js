/**
 * Composite pattern: validate and treat a flat list of onboarding fields as one unit
 * (whole-form check before finishing), while each leaf still encapsulates one field.
 */

export class FormFieldLeaf {
    constructor(fieldKey, validateFn) {
        this.fieldKey = fieldKey;
        this.validateFn = validateFn || (() => true);
    }

    validate(data) {
        const value = data?.[this.fieldKey];
        return this.validateFn(value);
    }
}

export class OnboardingFormComposite {
    /** @param {(FormFieldLeaf | OnboardingFormComposite)[]} children */
    constructor(children) {
        this.children = children;
    }

    validateAll(data) {
        return this.children.every((node) => {
            if (node instanceof OnboardingFormComposite) {
                return node.validateAll(data);
            }
            return node.validate(data);
        });
    }
}

export const buildOnboardingFormComposite = (stepsConfig) => {
    const leaves = stepsConfig.map(
        (step) =>
            new FormFieldLeaf(step.field, step.validate || ((v) => String(v || '').trim().length > 0)),
    );
    return new OnboardingFormComposite(leaves);
};
