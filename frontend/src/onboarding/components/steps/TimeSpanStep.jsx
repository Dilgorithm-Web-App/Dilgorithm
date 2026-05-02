const KNOWING_OPTIONS = ['1–2months', '1–2years', '6–9months', '2–3years'];
const MARRIAGE_OPTIONS = ['1–2years', '6–9months', '3–4 years', '5–6 years'];

const PillGroup = ({ options, selected, onSelect }) => (
    <div className="ob-pills ob-pills--tight" role="list">
        {options.map((item) => {
            const isSelected = selected === item;
            return (
                <button
                    key={item}
                    type="button"
                    className={`ob-pill ob-pill--soft ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => onSelect(item)}
                    aria-pressed={isSelected}
                >
                    {item}
                </button>
            );
        })}
    </div>
);

export const TimeSpanStep = ({ value, onChange }) => {
    const knowing = value?.knowing || '';
    const marriage = value?.marriage || '';

    return (
        <div className="ob-dual">
            <div className="ob-block">
                <h3 className="ob-h3">Time span for knowing</h3>
                <PillGroup
                    options={KNOWING_OPTIONS}
                    selected={knowing}
                    onSelect={(next) => onChange({ ...(value || {}), knowing: next })}
                />
            </div>

            <div className="ob-block ob-block--spaced">
                <h3 className="ob-h3">Time span for getting married</h3>
                <PillGroup
                    options={MARRIAGE_OPTIONS}
                    selected={marriage}
                    onSelect={(next) => onChange({ ...(value || {}), marriage: next })}
                />
            </div>
        </div>
    );
};

