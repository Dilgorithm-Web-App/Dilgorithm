import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Feed.css';

const COLORS = ['linear-gradient(135deg,#E57373,#EF5350)', 'linear-gradient(135deg,#64B5F6,#42A5F5)', 'linear-gradient(135deg,#81C784,#66BB6A)', 'linear-gradient(135deg,#BA68C8,#AB47BC)', 'linear-gradient(135deg,#FFB74D,#FFA726)', 'linear-gradient(135deg,#4DD0E1,#26C6DA)'];

export const Feed = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try { const r = await api.get('accounts/feed/'); setMatches(r.data); } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetch();
    }, []);

    const toggleFavorite = async (id) => {
        try {
            const res = await api.post('accounts/favorites/toggle/', { target_id: id });
            setFavorites(prev => {
                const next = new Set(prev);
                if (res.data.is_favorite) next.add(id);
                else next.delete(id);
                return next;
            });
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const topMatches = matches.slice(0, 3);
    const allMatches = matches;
    const topScore = matches.length ? Math.max(...matches.map(m => m.compatibility_score || 0)) : 0;
    const highCompat = matches.filter(m => (m.compatibility_score || 0) >= 70).length;
    const avgScore = matches.length ? Math.round(matches.reduce((s, m) => s + (m.compatibility_score || 0), 0) / matches.length) : 0;

    if (loading) return <div className="fd-loading"><div className="fd-spinner" /></div>;

    return (
        <div className="fd-wrap">
            {/* Title */}
            <h2 className="fd-main-title">✨ AI Recommended Matches ✨</h2>
            <p className="fd-subtitle">Personalized matches ranked by compatibility with your preferences</p>

            {/* Stats */}
            <div className="fd-stats">
                <div className="fd-stat"><div className="fd-stat-num">{topScore}%</div><div className="fd-stat-label">Top Match Score</div></div>
                <div className="fd-stat"><div className="fd-stat-num fd-stat-num--green">{highCompat}</div><div className="fd-stat-label">High Compatibility (70%+)</div></div>
                <div className="fd-stat"><div className="fd-stat-num">{avgScore}%</div><div className="fd-stat-label">Average Match Score</div></div>
            </div>

            {/* Top 3 */}
            {topMatches.length > 0 && (
                <>
                    <h3 className="fd-section-title">🏆 Top 3 Matches</h3>
                    <div className="fd-top3">
                        {topMatches.map((m, i) => (
                            <div key={m.id} className="fd-card" style={{ animationDelay: `${i * .1}s` }}>
                                <div className="fd-card-photo" style={{ background: COLORS[i] }}>
                                    <span className="fd-card-initial">{(m.fullName || m.username || 'U')[0].toUpperCase()}</span>
                                    {m.compatibility_score && <span className="fd-card-badge">{m.compatibility_score}% Match</span>}
                                    <button 
                                        className="fd-fav" 
                                        onClick={() => toggleFavorite(m.id)} 
                                        style={{ color: favorites.has(m.id) ? '#E57373' : 'inherit' }}
                                    >
                                        {favorites.has(m.id) ? '♥' : '♡'}
                                    </button>
                                </div>
                                <div className="fd-card-body">
                                    <h4 className="fd-card-name">{m.fullName || m.username}{m.age ? `, ${m.age}` : ''}</h4>
                                    {m.location && <p className="fd-card-meta">📍 {m.location}</p>}
                                    {m.education && <p className="fd-card-meta">🎓 {m.education}</p>}
                                    {m.bio && <p className="fd-card-meta">💼 {m.bio}</p>}
                                    <div className="fd-card-reason">
                                        <div className="fd-reason-title">Why this match:</div>
                                        <div className="fd-reason-text">{m.match_reason || "Based on your shared interests and preferences"}</div>
                                    </div>
                                    <button className="fd-view-btn" onClick={() => navigate(`/chat/room_${m.id}`)}>View Profile</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* All Matches */}
            <h3 className="fd-section-title" style={{ marginTop: 32 }}>All Recommended Matches</h3>
            {allMatches.length === 0 ? (
                <div className="fd-empty"><span style={{ fontSize: 40 }}>💔</span><p>No matches found. Broaden your preferences!</p></div>
            ) : (
                <div className="fd-grid">
                    {allMatches.map((m, i) => (
                        <div key={m.id} className="fd-card" style={{ animationDelay: `${i * .06}s` }}>
                            <div className="fd-card-photo" style={{ background: COLORS[i % 6] }}>
                                <span className="fd-card-initial">{(m.fullName || m.username || 'U')[0].toUpperCase()}</span>
                                {m.compatibility_score && <span className="fd-card-badge">{m.compatibility_score}% Match</span>}
                                <button 
                                    className="fd-fav" 
                                    onClick={() => toggleFavorite(m.id)} 
                                    style={{ color: favorites.has(m.id) ? '#E57373' : 'inherit' }}
                                >
                                    {favorites.has(m.id) ? '♥' : '♡'}
                                </button>
                            </div>
                            <div className="fd-card-body">
                                <h4 className="fd-card-name">{m.fullName || m.username}{m.age ? `, ${m.age}` : ''}</h4>
                                {m.location && <p className="fd-card-meta">📍 {m.location}</p>}
                                {m.bio && <p className="fd-card-meta">💼 {m.bio}</p>}
                                <button className="fd-view-btn" onClick={() => navigate(`/chat/room_${m.id}`)}>View Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};