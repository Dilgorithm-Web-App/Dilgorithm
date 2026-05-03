import { OnboardingStepTemplate } from '../../templates/OnboardingStepTemplate';

/** LSP: same props shape everywhere; optional `options` switches control without breaking callers. */
export const StepQuestion = ({ title, placeholder, value, onChange, options }) => {
    const useSelect = Array.isArray(options) && options.length > 0;
    return (
        <OnboardingStepTemplate
            title={title}
            renderBody={() =>
                useSelect ? (
                    <select
                        className="ob-input"
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        aria-label={title || 'Select option'}
                    >
                        <option value="">Select…</option>
                        {options.map((opt) => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        className="ob-input"
                        type="text"
                        value={value}
                        placeholder={placeholder || ' '}
                        onChange={(e) => onChange(e.target.value)}
                    />
                )
            }
        />
    );
};
