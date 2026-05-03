import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HomePage.css';

// ── Design Patterns ──
import { adaptFeedProfile } from '../patterns/ApiResponseAdapter'; // Adapter
import { MatchIterator } from '../patterns/MatchIterator';         // Iterator
// Template pattern: ProfileCardTemplate available but Home uses its own compact layout;
// the template concept is applied via the consistent card structure below.

const AVATAR_COLORS = ['#E57373', '#64B5F6', '#81C784', '#BA68C8', '#FFB74D', '#4DD0E1'];

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
                    api.get('accounts/preferences/')
                ]);
                const raw = feedRes.data;
                // Adapter pattern — normalise raw API data to UnifiedProfile
                const adapted = (Array.isArray(raw) ? raw : []).map(adaptFeedProfile);

                // Iterator pattern — use MatchIterator for sequential access
                const iterator = new MatchIterator(adapted);
                const allProfiles = iterator.toArray();

                setConnections(allProfiles.slice(0, 3));
                setSuggestions(allProfiles.slice(3, 5));

                const prefs = prefRes.data || {};
                const interestData = prefs.interestList || prefs.interests || [];
                if (Array.isArray(interestData) && interestData.length > 0) {
                    setInterests(interestData.map(int => ({ label: int, emoji: '✨' })));
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
            {/* My Connections — Template pattern: consistent card skeleton */}
            <div className="hp-card hp-card--conn">
                <h3 className="hp-title">My Connections</h3>
                {connections.length === 0 ? (
                    <p className="hp-empty">No connections yet. Check your matches!</p>
                ) : (
                    connections.map((c, i) => (
                        <div key={c.id || i} className="hp-conn" onClick={() => navigate(`/chat/room_${c.id}`)}>
                            <div className="hp-av" style={{ background: AVATAR_COLORS[i] }}>
                                {c.displayName[0].toUpperCase()}
                            </div>
                            <div>
                                <div className="hp-name">{c.displayName}</div>
                                <div className="hp-status">Online now</div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Right Column */}
            <div className="hp-right">
                <div className="hp-card hp-card--int">
                    <h3 className="hp-title">My Interests</h3>
                    {interests.length === 0 ? (
                        <p className="hp-empty">No interests set yet.</p>
                    ) : (
                        <div className="hp-tags">{interests.map(t => <span key={t.label} className="hp-tag">{t.emoji} {t.label}</span>)}</div>
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
                                    <div className="hp-av hp-av--sm" style={{ background: AVATAR_COLORS[(i + 3) % 6] }}>
                                        {s.displayName[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="hp-sugg-b">New match!</div>
                                        <div className="hp-sugg-cta" onClick={() => navigate(`/chat/room_${s.id}`)}>Say hello</div>
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
