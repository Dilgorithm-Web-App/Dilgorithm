import { ONBOARDING_STEPS } from '../config/stepsConfig';

class UserFormDataStore {
    constructor() {
        if (UserFormDataStore.instance) {
            return UserFormDataStore.instance;
        }
        this.data = ONBOARDING_STEPS.reduce((acc, step) => {
            const value = step.defaultValue;
            acc[step.field] = Array.isArray(value) ? [...value] : (value ?? '');
            return acc;
        }, {});
        this.listeners = new Set();
        UserFormDataStore.instance = this;
    }

    getData() {
        return { ...this.data };
    }

    setField(field, value) {
        this.data[field] = value;
        this.emit();
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit() {
        const payload = this.getData();
        this.listeners.forEach((listener) => listener(payload));
    }
}

export const userFormDataStore = new UserFormDataStore();
