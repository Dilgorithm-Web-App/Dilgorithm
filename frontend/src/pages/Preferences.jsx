import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import './Preferences.css';
import { FamilyForm } from '../components/FamilyForm';

export const Preferences = () => {
    const [interests, setInterests] = useState('');
    const [sect, setSect] = useState('');
    const [location, setLocation] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('accounts/preferences/');
                const data = response.data;
                const list = data.interestList;
                setInterests(Array.isArray(list) ? list.join(', ') : '');
                setSect(data.partnerCriteria?.sect || '');
                setLocation(data.partnerCriteria?.location || '');
            } catch (error) {
                console.error('Failed to load preferences:', error);
            }
        };
        fetchPreferences();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const interestArray = interests.split(',').map((item) => item.trim()).filter((item) => item !== '');

        const payload = {
            interestList: interestArray,
            partnerCriteria: {
                sect: sect,
                location: location,
            },
        };

        try {
            await api.put('accounts/preferences/', payload);
            alert('Preferences saved successfully!');
            navigate('/feed');
        } catch (error) {
            alert('Failed to save preferences.');
        }
    };

    return (
        <div className="pref-page">
            <div className="pref-card">
                <button type="button" className="pref-back" onClick={() => navigate('/settings')}>
                    Back
                </button>
                <h1 className="pref-title">Set Your Preferences</h1>
                <p className="pref-sub">Help the Dilgorithm AI find your perfect match.</p>

                <form className="pref-form" onSubmit={handleSubmit}>
                    <div className="pref-field">
                        <label className="pref-label" htmlFor="pref-interests">
                            Your interests (comma separated)
                        </label>
                        <input
                            id="pref-interests"
                            className="pref-input"
                            type="text"
                            value={interests}
                            onChange={(e) => setInterests(e.target.value)}
                            placeholder="e.g. Reading, Hiking, Cooking"
                            autoComplete="off"
                        />
                    </div>

                    <div className="pref-field">
                        <label className="pref-label" htmlFor="pref-sect">
                            Preferred sect (religious constraint)
                        </label>
                        <select
                            id="pref-sect"
                            className="pref-select"
                            value={sect}
                            onChange={(e) => setSect(e.target.value)}
                        >
                            <option value="">Any</option>
                            <option value="Sunni">Sunni</option>
                            <option value="Shia">Shia</option>
                            <option value="Just Muslim">Just Muslim</option>
                        </select>
                    </div>

                    <div className="pref-field">
                        <label className="pref-label" htmlFor="pref-location">
                            Preferred location
                        </label>
                        <input
                            id="pref-location"
                            className="pref-input"
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="e.g. Lahore, Pakistan"
                            autoComplete="off"
                        />
                    </div>

                    <div className="pref-actions">
                        <button type="submit" className="pref-btn pref-btn--save">
                            Save AI preferences
                        </button>
                        <button
                            type="button"
                            className="pref-btn pref-btn--profile"
                            onClick={() => window.location.assign('/figma-import/slide1.html')}
                        >
                            Edit profile
                        </button>
                        <button type="button" className="pref-btn pref-btn--ghost" onClick={() => navigate('/feed')}>
                            Cancel & return to feed
                        </button>
                    </div>
                </form>
            </div>
            
            <FamilyForm />
        </div>
    );
};
