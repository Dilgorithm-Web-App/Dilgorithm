import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useCatalogMetadata } from '../hooks/useCatalogMetadata';
import './Preferences.css';
import { FamilyForm } from '../components/FamilyForm';

function mergeOption(value, options) {
    const list = Array.isArray(options) ? [...options] : [];
    if (value && !list.includes(value)) list.unshift(value);
    return list;
}

export const Preferences = () => {
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [sect, setSect] = useState('');
    const [location, setLocation] = useState('');
    const [prefsLoaded, setPrefsLoaded] = useState(false);
    const navigate = useNavigate();

    const { data: catalogData, loading: catalogLoading, error: catalogError } = useCatalogMetadata();

    const filters = catalogData?.filters;
    const availableInterests = catalogData?.interests ?? [];

    const locationOptions = useMemo(() => mergeOption(location, filters?.locations), [location, filters?.locations]);
    const sectOptions = useMemo(() => mergeOption(sect, filters?.sects), [sect, filters?.sects]);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('accounts/preferences/');
                const data = response.data;
                const list = data.interestList;
                setSelectedInterests(Array.isArray(list) ? [...list] : []);
                setSect(data.partnerCriteria?.sect || '');
                setLocation(data.partnerCriteria?.location || '');
            } catch (error) {
                console.error('Failed to load preferences:', error);
            } finally {
                setPrefsLoaded(true);
            }
        };
        fetchPreferences();
    }, []);

    const toggleInterest = (label) => {
        setSelectedInterests((prev) =>
            prev.includes(label) ? prev.filter((x) => x !== label) : [...prev, label],
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            interestList: selectedInterests,
            partnerCriteria: {
                sect,
                location,
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
                <button type="button" className="pref-mini-link" onClick={() => navigate('/edit-profile')}>
                    Edit photo & bio
                </button>
                <h1 className="pref-title">Set Your Preferences</h1>
                <p className="pref-sub">Help the Dilgorithm AI find your perfect match.</p>

                {catalogError ? (
                    <p className="pref-banner pref-banner--error" role="alert">
                        Could not load filter lists. Check connection.
                    </p>
                ) : null}
                {catalogLoading && !catalogData ? (
                    <p className="pref-banner">Loading options…</p>
                ) : null}

                <form className="pref-form" onSubmit={handleSubmit}>
                    <div className="pref-field">
                        <span className="pref-label" id="pref-interests-label">
                            Your interests
                        </span>
                        <p className="pref-hint">Tap to select from server-provided interests.</p>
                        <div className="pref-pills" role="group" aria-labelledby="pref-interests-label">
                            {availableInterests.map((item) => {
                                const on = selectedInterests.includes(item);
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        className={`pref-pill ${on ? 'pref-pill--on' : ''}`}
                                        aria-pressed={on}
                                        onClick={() => toggleInterest(item)}
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                        </div>
                        {prefsLoaded && availableInterests.length === 0 && !catalogLoading ? (
                            <p className="pref-hint">No interests returned from the server.</p>
                        ) : null}
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
                            disabled={!filters?.sects?.length && !sect}
                        >
                            <option value="">Any</option>
                            {sectOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pref-field">
                        <label className="pref-label" htmlFor="pref-location">
                            Preferred location
                        </label>
                        <select
                            id="pref-location"
                            className="pref-select"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            disabled={!filters?.locations?.length && !location}
                        >
                            <option value="">Any</option>
                            {locationOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pref-actions">
                        <button type="submit" className="pref-btn pref-btn--save">
                            Save AI preferences
                        </button>
                        <button
                            type="button"
                            className="pref-btn pref-btn--profile"
                            onClick={() => navigate('/edit-profile')}
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
