import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getFirstProfileImageSrc } from '../utils/profileImageSrc';
import './ProfilePage.css';

/** Read-only “my profile” view — uses same image rules as UserCard / header avatar */
export const ProfilePage = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get('accounts/profile/');
                if (!cancelled) setProfile(data);
            } catch {
                if (!cancelled) setError('Could not load profile.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const imgSrc = profile ? getFirstProfileImageSrc(profile.images) : null;
    const initial = (profile?.fullName || 'U').slice(0, 1).toUpperCase();

    return (
        <div className="pp-page">
            <div className="pp-card">
                <button type="button" className="pp-back" onClick={() => navigate('/settings')}>
                    Back
                </button>
                <h1 className="pp-title">Profile</h1>

                {error ? (
                    <p className="pp-error" role="alert">
                        {error}
                    </p>
                ) : null}

                {!profile && !error ? <p className="pp-muted">Loading…</p> : null}

                {profile ? (
                    <>
                        <div className={`pp-photo-wrap ${imgSrc ? 'pp-photo-wrap--img' : ''}`}>
                            {imgSrc ? (
                                <img src={imgSrc} alt="" className="pp-photo" decoding="async" />
                            ) : (
                                <span className="pp-photo-placeholder">{initial}</span>
                            )}
                        </div>
                        <h2 className="pp-name">{profile.fullName || '—'}</h2>
                        {profile.bio ? <p className="pp-bio">{profile.bio}</p> : null}
                        <div className="pp-meta">
                            {profile.location ? <span>📍 {profile.location}</span> : null}
                            {profile.education ? <span>🎓 {profile.education}</span> : null}
                            {profile.profession ? <span>💼 {profile.profession}</span> : null}
                        </div>
                        <button type="button" className="pp-edit" onClick={() => navigate('/profile/edit')}>
                            Edit profile photo
                        </button>
                    </>
                ) : null}
            </div>
        </div>
    );
};
