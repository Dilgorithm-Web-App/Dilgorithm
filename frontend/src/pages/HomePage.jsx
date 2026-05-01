import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './HomePage.css';

const AVATAR_COLORS = ['#E57373', '#64B5F6', '#81C784', '#BA68C8', '#FFB74D', '#4DD0E1'];

export const HomePage = () => {
    const [connections, setConnections] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('accounts/feed/');
                const data = res.data || [];
                setConnections(data.slice(0, 3));
                setSuggestions(data.slice(3, 5));
            } catch (err) {
                console.error('Failed to load home data:', err);
            }
        };
        fetchData();
    }, []);

    const interests = [
        { label: 'Sports', emoji: '🏀' },
        { label: 'Fitness', emoji: '💪' },
        { label: 'Food', emoji: '🍔' },
        { label: 'Movies', emoji: '🎬' },
        { label: 'Travel', emoji: '✈️' },
    ];

    return (
        <div className="hp-grid">
            {/* My Connections */}
            <div className="hp-card hp-card--conn">
                <h3 className="hp-title">My Connections</h3>
                {connections.length === 0 ? (
                    <p className="hp-empty">No connections yet. Check your matches!</p>
                ) : (
                    connections.map((c, i) => (
                        <div key={c.id || i} className="hp-conn" onClick={() => navigate(`/chat/room_${c.id}`)}>
                            <div className="hp-av" style={{ background: AVATAR_COLORS[i] }}>{(c.fullName || c.username || 'U')[0].toUpperCase()}</div>
                            <div><div className="hp-name">{c.fullName || c.username}</div><div className="hp-status">Online now</div></div>
                        </div>
                    ))
                )}
            </div>

            {/* Right Column */}
            <div className="hp-right">
                <div className="hp-card hp-card--int">
                    <h3 className="hp-title">My Interests</h3>
                    <div className="hp-tags">{interests.map(t => <span key={t.label} className="hp-tag">{t.emoji} {t.label}</span>)}</div>
                </div>
                <div className="hp-card hp-card--sug">
                    <h3 className="hp-title">Suggested Connections</h3>
                    {suggestions.length === 0 ? (
                        <p className="hp-empty">No suggestions yet.</p>
                    ) : (
                        suggestions.map((s, i) => (
                            <div key={s.id || i} className="hp-sugg">
                                <div className="hp-sugg-l">
                                    <div className="hp-av hp-av--sm" style={{ background: AVATAR_COLORS[(i + 3) % 6] }}>{(s.fullName || s.username || 'U')[0].toUpperCase()}</div>
                                    <div><div className="hp-sugg-b">New match!</div><div className="hp-sugg-cta" onClick={() => navigate(`/chat/room_${s.id}`)}>Say hello</div></div>
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
