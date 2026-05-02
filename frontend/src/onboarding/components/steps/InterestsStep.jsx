import { OnboardingStepTemplate } from '../../templates/OnboardingStepTemplate';

const INTEREST_OPTIONS = [
    'READING',
    'COOKING',
    'BASKETBALL',
    'TRAVELLING',
    'KNITTING',
    'BAKING',
    'BADMINTON',
    'BOXING',
    'SINGING',
    'DANCING',
    'PAINTING',
];

export const InterestsStep = ({ title, value, onChange }) => {
    const selected = Array.isArray(value) ? value : [];

    const toggle = (item) => {
        const isSelected = selected.includes(item);
        if (isSelected) {
            onChange(selected.filter((x) => x !== item));
            return;
        }
        if (selected.length >= 3) return;
        onChange([...selected, item]);
    };

    return (
        <OnboardingStepTemplate
            title={title}
            renderBody={() => (
                <>
                    <div className="ob-pills" role="list" aria-label="Interests">
                        {INTEREST_OPTIONS.map((item) => {
                            const isSelected = selected.includes(item);
                            return (
                                <button
                                    key={item}
                                    type="button"
                                    className={`ob-pill ${isSelected ? 'is-selected' : ''}`}
                                    onClick={() => toggle(item)}
                                    aria-pressed={isSelected}
                                >
                                    {item}
                                </button>
                            );
                        })}
                    </div>
                    <div className="ob-hint">{selected.length}/3 selected</div>
                </>
            )}
        />
    );
};

