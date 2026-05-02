import { OnboardingStepTemplate } from '../../templates/OnboardingStepTemplate';

export const StepQuestion = ({ title, placeholder, value, onChange }) => (
    <OnboardingStepTemplate
        title={title}
        renderBody={() => (
            <input
                className="ob-input"
                type="text"
                value={value}
                placeholder={placeholder || ' '}
                onChange={(e) => onChange(e.target.value)}
            />
        )}
    />
);
