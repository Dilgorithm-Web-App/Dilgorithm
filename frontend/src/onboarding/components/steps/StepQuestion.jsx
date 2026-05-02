export const StepQuestion = ({ title, placeholder, value, onChange }) => (
    <>
        <h3>{title}</h3>
        <input
            className="ob-input"
            type="text"
            value={value}
            placeholder={placeholder || ' '}
            onChange={(e) => onChange(e.target.value)}
        />
    </>
);
