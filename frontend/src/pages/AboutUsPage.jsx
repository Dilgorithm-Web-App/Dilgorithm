import './AboutUsPage.css';

const InstagramIcon = (props) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props}>
        <rect x="6" y="6" width="12" height="12" rx="3.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="16.3" cy="7.7" r="1" fill="currentColor" />
    </svg>
);

const GlobeIcon = (props) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props}>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M12 4c2.3 2.2 3.6 5 3.6 8S14.3 17.8 12 20c-2.3-2.2-3.6-5-3.6-8S9.7 6.2 12 4Z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
);

const XIcon = (props) => (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" {...props}>
        <path d="M7 6h3.2l6.8 12H13.8L7 6Z" fill="currentColor" />
        <path d="M17 6h-2.8l-7.2 12H9.8L17 6Z" fill="currentColor" opacity="0.9" />
    </svg>
);

export const AboutUsPage = () => {
    return (
        <div className="au-wrap">
            <div className="au-phone">
                <h1 className="au-title">ABOUT US</h1>

                <div className="au-grid">
                    <section className="au-card">
                        <h2 className="au-card-title">MISSION</h2>
                        <p className="au-card-body">
                            Dilgorithm provides the
                            ultimate final match
                            partner. It always
                            wins.
                        </p>
                    </section>

                    <section className="au-card">
                        <h2 className="au-card-title">GOAL</h2>
                        <p className="au-card-body">
                            Give total clarity and
                            final control.
                        </p>
                    </section>
                </div>

                <section className="au-card au-card--services">
                    <h2 className="au-card-title">SERVICES</h2>
                    <ul className="au-list">
                        <li>Precision without Complexity</li>
                        <li>Built for Your Vision</li>
                        <li>Confidence at Scale</li>
                    </ul>
                </section>

                <footer className="au-footer">
                    <div className="au-social-row">
                        <div className="au-social">
                            <div className="au-social-icon" aria-hidden="true">
                                <InstagramIcon className="au-social-svg" />
                            </div>
                            <div className="au-social-text">
                                <div>CONNECT</div>
                                <div>WITH US</div>
                            </div>
                        </div>

                        <div className="au-social">
                            <div className="au-social-icon" aria-hidden="true">
                                <GlobeIcon className="au-social-svg" />
                            </div>
                            <div className="au-social-text">
                                <div>FIND</div>
                                <div>US</div>
                            </div>
                        </div>

                        <div className="au-social">
                            <div className="au-social-icon" aria-hidden="true">
                                <XIcon className="au-social-svg" />
                            </div>
                            <div className="au-social-text">
                                <div>FOLLOW</div>
                                <div>US</div>
                            </div>
                        </div>
                    </div>

                    <div className="au-footer-links">
                        <span>@DILGORITHM</span>
                        <span>WWW.DILGORITHM.COM</span>
                        <span>X/DILGORITHM</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

