import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AppConfigurationPage.css';

export const AppConfigurationPage = () => {
    const navigate = useNavigate();
    const [language, setLanguage] = useState('English');
    const [permissions, setPermissions] = useState({
        location: true,
        notifications: true,
        camera: true,
    });
    const [status, setStatus] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const { data } = await api.get('accounts/app-configuration/');
                setLanguage(data.language || 'English');
                setPermissions({
                    location: Boolean(data?.permissions?.location),
                    notifications: Boolean(data?.permissions?.notifications),
                    camera: Boolean(data?.permissions?.camera),
                });
            } catch (error) {
                setStatus('Could not load app configuration from server.');
            }
        };
        fetchConfig();
    }, []);

    const togglePermission = (key) => {
        setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const saveConfig = async () => {
        setStatus('');
        try {
            await api.put('accounts/app-configuration/', {
                language,
                permissions,
            });
            setStatus('App configuration saved successfully.');
        } catch (error) {
            setStatus('Failed to save app configuration.');
        }
    };

    return (
        <div className="ac-wrap">
            <div className="ac-card">
                <button className="ac-back-btn" onClick={() => navigate('/settings')}>
                    ← Back
                </button>
                <h2 className="ac-title">App Configuration</h2>
                <p className="ac-subtitle">Language and permissions for your app experience.</p>

                <section className="ac-section">
                    <h3 className="ac-heading">Language & Translations</h3>
                    <label className="ac-row">
                        <span>Language</span>
                        <select
                            className="ac-select"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                        >
                            <option value="English">English</option>
                            <option value="Urdu">Urdu</option>
                        </select>
                    </label>
                </section>

                <section className="ac-section">
                    <h3 className="ac-heading">Permissions</h3>
                    <button className="ac-row ac-row-btn" onClick={() => togglePermission('location')}>
                        <span>Location</span>
                        <span>{permissions.location ? 'ON' : 'OFF'}</span>
                    </button>
                    <button className="ac-row ac-row-btn" onClick={() => togglePermission('notifications')}>
                        <span>Notifications</span>
                        <span>{permissions.notifications ? 'ON' : 'OFF'}</span>
                    </button>
                    <button className="ac-row ac-row-btn" onClick={() => togglePermission('camera')}>
                        <span>Camera</span>
                        <span>{permissions.camera ? 'ON' : 'OFF'}</span>
                    </button>
                </section>
                <div className="ac-actions">
                    <button className="ac-save-btn" onClick={saveConfig}>Save Configuration</button>
                    {status ? <p className="ac-status">{status}</p> : null}
                </div>
            </div>
        </div>
    );
};
