import { OnboardingStepTemplate } from '../../templates/OnboardingStepTemplate';

export const InterestsStep = ({ title, value, onChange, optionLists, catalogLoading }) => {
    const selected = Array.isArray(value) ? value : [];
    const INTEREST_OPTIONS = Array.isArray(optionLists?.interests) ? optionLists.interests : [];

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
                    {catalogLoading && INTEREST_OPTIONS.length === 0 ? (
                        <p className="ob-hint">Loading interests…</p>
                    ) : null}
                    {!catalogLoading && INTEREST_OPTIONS.length === 0 ? (
                        <p className="ob-hint">No interests available. Refresh and try again.</p>
                    ) : null}
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

