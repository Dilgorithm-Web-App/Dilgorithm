import { useNavigate, useSearchParams } from 'react-router-dom';
import { BaseStepLayout } from '../onboarding/layouts/BaseStepLayout';
import { StepFactory } from '../onboarding/factory/StepFactory';
import { TOTAL_STEPS } from '../onboarding/config/stepsConfig';
import { useOnboardingLogic } from '../onboarding/hooks/useOnboardingLogic';
import './OnboardingPage.css';

export const OnboardingPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const stepParam = searchParams.get('step') || 'profession';
    const {
        stepIndex,
        currentStep,
        currentValue,
        progress,
        isCurrentValid,
        isFirstStep,
        isLastStep,
        isSaving,
        setCurrentValue,
        confirmStep,
        nextStep,
        previousStep,
    } = useOnboardingLogic({
        onComplete: () => navigate('/home'),
        initialStepKey: stepParam,
        onStepKeyChange: (nextKey) => setSearchParams({ step: nextKey }, { replace: true }),
    });

    const StepComponent = StepFactory.create(currentStep.key);

    return (
        <div className="ob-page">
            <BaseStepLayout
                stepLabel={`Step ${stepIndex + 1} / ${TOTAL_STEPS}`}
                completedLabel={`${currentStep.completedPercent}% COMPLETED`}
                progress={progress}
                isConfirmDisabled={!isCurrentValid}
                isNextDisabled={!isCurrentValid}
                onConfirm={nextStep}
                onNext={nextStep}
                onPrevious={previousStep}
                isFirst={isFirstStep}
                isLast={isLastStep}
                isSaving={isSaving}
            >
                <StepComponent
                    title={currentStep.title}
                    placeholder={currentStep.placeholder}
                    value={currentValue}
                    onChange={setCurrentValue}
                />
            </BaseStepLayout>
        </div>
    );
};
