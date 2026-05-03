/**
 * Template Method (presentation layer): fixed skeleton for every onboarding step —
 * title region + body slot. Concrete steps supply `renderBody`; layout stays consistent
 * (Open/Closed: extend via renderBody, not by copying markup).
 */
export const OnboardingStepTemplate = ({ title, renderBody }) => (
    <div className="ob-step-template">
        {title ? <h3 className="ob-step-template__title">{title}</h3> : null}
        <div className="ob-step-template__body">{renderBody()}</div>
    </div>
);
