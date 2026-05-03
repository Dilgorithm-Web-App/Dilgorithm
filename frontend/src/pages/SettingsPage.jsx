import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './SettingsPage.css';

// ── Design Patterns ──
// Factory pattern: settings items are created from a configuration array.
// This mirrors the StepFactory / PageFactory pattern — the component
// doesn't hardcode which action each button performs; it reads from the
// SETTINGS_ITEMS config and creates the UI uniformly (SRP, OCP).

/**
 * Factory pattern — settings navigation item configuration.
 * Adding a new settings page requires only adding an entry here (OCP).
 * Each item is a "product" created by the factory config.
 */
const createSettingsItems = (navigate, logout) => [
    { key: 'account',      label: 'Account &\nProfile',         action: () => navigate('/edit-profile') },
    { key: 'engagement',   label: 'Engagement &\nModeration',   action: () => navigate('/engagement-moderation') },
    { key: 'config',       label: 'App\nConfiguration',         action: () => navigate('/app-configuration') },
    { key: 'support',      label: 'Support &\nLegal',           action: () => navigate('/about-us') },
    { key: 'logout',       label: 'Logout',                     action: logout, danger: true },
];

export const SettingsPage = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    // Factory pattern — create settings items from config
    const items = createSettingsItems(navigate, logout);

    return (
        <div className="st-wrap">
            <div className="st-card">
                {/* Iterator pattern — iterate over factory-produced items */}
                {items.map((item, i) => (
                    <button
                        key={item.key}
                        className={`st-btn ${item.danger ? 'st-btn--danger' : ''}`}
                        onClick={item.action}
                        style={{ animationDelay: `${i * .08}s` }}
                    >
                        {item.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
