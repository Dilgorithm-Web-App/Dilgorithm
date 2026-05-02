import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import './SettingsPage.css';

export const SettingsPage = () => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const items = [
        { label: 'Account &\nProfile', action: () => navigate('/preferences') },
        { label: 'Engagement &\nModeration', action: () => {} },
        { label: 'App\nConfiguration', action: () => navigate('/preferences') },
        { label: 'Support &\nLegal', action: () => navigate('/about-us') },
        { label: 'Logout', action: logout, danger: true },
    ];

    return (
        <div className="st-wrap">
            <div className="st-card">
                {items.map((item, i) => (
                    <button
                        key={i}
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
