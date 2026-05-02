import { useEffect, useMemo, useState } from 'react';
import { ONBOARDING_STEPS, TOTAL_STEPS } from '../config/stepsConfig';
import { StepIterator } from '../patterns/StepIterator';
import { getInitialState } from '../patterns/FlowState';
import { userFormDataStore } from '../store/UserFormDataStore';
import { progressSubject } from '../observer/ProgressSubject';
import { adaptOnboardingToProfilePayload } from '../adapters/profileAdapter';
import { defaultApiService } from '../services/ApiService';

export const useOnboardingLogic = ({ apiService = defaultApiService, onComplete }) => {
    const [flowState, setFlowState] = useState(getInitialState());
    const [formData, setFormData] = useState(userFormDataStore.getData());
    const [progress, setProgress] = useState((1 / TOTAL_STEPS) * 100);
    const [isSaving, setIsSaving] = useState(false);

    const iterator = useMemo(() => new StepIterator(ONBOARDING_STEPS, 0), []);
    const stepIndex = flowState.value();
    const currentStep = ONBOARDING_STEPS[stepIndex];
    const currentValue = formData[currentStep.field] || '';
    const isCurrentValid = currentValue.trim().length > 0;

    useEffect(() => {
        const unsubscribeData = userFormDataStore.subscribe((nextData) => {
            setFormData(nextData);
            const filled = ONBOARDING_STEPS.filter((s) => (nextData[s.field] || '').trim().length > 0).length;
            progressSubject.notify((filled / TOTAL_STEPS) * 100);
        });
        const unsubscribeProgress = progressSubject.subscribe((nextProgress) => setProgress(nextProgress));
        return () => {
            unsubscribeData();
            unsubscribeProgress();
        };
    }, []);

    const setCurrentValue = (value) => {
        userFormDataStore.setField(currentStep.field, value);
    };

    const syncStep = async () => {
        setIsSaving(true);
        try {
            const payload = adaptOnboardingToProfilePayload(userFormDataStore.getData());
            await apiService.patchUserProfile(payload);
        } finally {
            setIsSaving(false);
        }
    };

    const confirmStep = async () => {
        if (!isCurrentValid) {
            return false;
        }
        await syncStep();
        return true;
    };

    const nextStep = async () => {
        const ok = await confirmStep();
        if (!ok) return;
        if (iterator.isLast()) {
            if (onComplete) onComplete();
            return;
        }
        iterator.next();
        setFlowState((prev) => prev.next());
    };

    const previousStep = () => {
        if (iterator.isFirst()) return;
        iterator.previous();
        setFlowState((prev) => prev.previous());
    };

    return {
        stepIndex,
        currentStep,
        currentValue,
        progress,
        isCurrentValid,
        isFirstStep: iterator.isFirst(),
        isLastStep: iterator.isLast(),
        isSaving,
        setCurrentValue,
        confirmStep,
        nextStep,
        previousStep,
    };
};
