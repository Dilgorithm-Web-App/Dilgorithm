import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import './HomePage.css';

const HomeAvatar = ({ profile, small }) => {
    const src = getProfilePhotoImgSrc(profile?.images);
    return (
        <div className={`hp-av ${small ? 'hp-av--sm' : ''}`}>
            <img src={src} alt="" className="hp-av-img" loading="lazy" decoding="async" />
        </div>
    );
};

export const HomePage = () => {
    const [connections, setConnections] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [interests, setInterests] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [feedRes, prefRes] = await Promise.all([
                    api.get('accounts/feed/'),
                    api.get('accounts/preferences/'),
                ]);
                const raw = feedRes.data;
                const data = Array.isArray(raw) ? raw : [];

                setConnections(data.slice(0, 3));
                setSuggestions(data.slice(3, 5));

                const prefs = prefRes.data || {};
                const interestData = prefs.interestList || prefs.interests || [];
                if (Array.isArray(interestData) && interestData.length > 0) {
                    setInterests(interestData.map((int) => ({ label: int, emoji: '✨' })));
                } else {
                    setInterests([]);
                }
            } catch (err) {
                console.error('Failed to load home data:', err);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="hp-grid">
            <div className="hp-card hp-card--conn">
                <h3 className="hp-title">My Connections</h3>
                {connections.length === 0 ? (
                    <p className="hp-empty">No connections yet. Check your matches!</p>
                ) : (
                    connections.map((c, i) => (
                        <div key={c.id || i} className="hp-conn" onClick={() => navigate(`/chat/room_${c.id}`)}>
                            <HomeAvatar profile={c} />
                            <div>
                                <div className="hp-name">{c.fullName || c.username}</div>
                                <div className="hp-status">Online now</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="hp-right">
                <div className="hp-card hp-card--int">
                    <h3 className="hp-title">My Interests</h3>
                    {interests.length === 0 ? (
                        <p className="hp-empty">No interests set yet.</p>
                    ) : (
                        <div className="hp-tags">
                            {interests.map((t) => (
                                <span key={t.label} className="hp-tag">
                                    {t.emoji} {t.label}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                <div className="hp-card hp-card--sug">
                    <h3 className="hp-title">Suggested Connections</h3>
                    {suggestions.length === 0 ? (
                        <p className="hp-empty">No suggestions yet.</p>
                    ) : (
                        suggestions.map((s, i) => (
                            <div key={s.id || i} className="hp-sugg">
                                <div className="hp-sugg-l">
                                    <HomeAvatar profile={s} small />
                                    <div>
                                        <div className="hp-sugg-b">New match!</div>
                                        <div className="hp-sugg-cta" onClick={() => navigate(`/chat/room_${s.id}`)}>
                                            Say hello
                                        </div>
                                    </div>
                                </div>
                                <span className="hp-dot" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
