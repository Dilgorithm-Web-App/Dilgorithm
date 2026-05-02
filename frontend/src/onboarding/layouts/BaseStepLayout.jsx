export const BaseStepLayout = ({
    stepLabel,
    completedLabel,
    progress,
    children,
    isConfirmDisabled,
    isNextDisabled,
    onConfirm,
    onNext,
    onPrevious,
    isFirst,
    isLast,
    isSaving,
}) => (
    <div className="ob-shell">
        <header className="ob-header">
            <div className="ob-brand-wrap">
                <img
                    src="https://api.builder.io/api/v1/image/assets/TEMP/ab8ae37c310a0267e191c59a487c6d6c22e5e577?width=189"
                    alt="Dilgorithm logo"
                    className="ob-brand"
                />
            </div>
            <div className="ob-progress-wrap">
                <button type="button" className="ob-nav-icon" onClick={onPrevious} disabled={isFirst || isSaving}>
                    &#8249;
                </button>
                <div className="ob-progress">
                    <div className="ob-progress-fill" style={{ width: `${progress}%` }} />
                    <div className="ob-progress-thumb" style={{ left: `calc(${progress}% - 14px)` }} />
                </div>
                <button type="button" className="ob-nav-icon" onClick={onNext} disabled={isNextDisabled || isSaving}>
                    &#8250;
                </button>
                <span className="ob-step-label">{stepLabel}</span>
                <span className="ob-complete-label">{completedLabel}</span>
            </div>
        </header>

        <section className="ob-question">{children}</section>

        <footer className="ob-footer">
            <button type="button" onClick={onConfirm} disabled={isConfirmDisabled || isSaving}>
                {isSaving ? 'Saving...' : 'Confirm'}
            </button>
        </footer>
    </div>
);
