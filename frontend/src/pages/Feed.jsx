import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './Feed.css';

// ── Design Patterns ──
import { adaptFeedProfile } from '../patterns/ApiResponseAdapter';   // Adapter
import { MatchIterator } from '../patterns/MatchIterator';           // Iterator
import { eventBus } from '../patterns/EventBus';                     // Observer
// Template pattern: ProfileCardTemplate provides fixed card skeleton (used below)
import { ProfileCardTemplate } from '../patterns/ProfileCardTemplate';

const COLORS = ['linear-gradient(135deg,#E57373,#EF5350)', 'linear-gradient(135deg,#64B5F6,#42A5F5)', 'linear-gradient(135deg,#81C784,#66BB6A)', 'linear-gradient(135deg,#BA68C8,#AB47BC)', 'linear-gradient(135deg,#FFB74D,#FFA726)', 'linear-gradient(135deg,#4DD0E1,#26C6DA)'];

export const Feed = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const r = await api.get('accounts/feed/');
                // Adapter pattern — normalise raw API data to UnifiedProfile
                const adapted = (r.data || []).map(adaptFeedProfile);
                setMatches(adapted);
            } catch (e) { console.error(e); }
            setLoading(false);
        };
        fetchData();
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
            // Observer pattern — publish event so other components can react
            eventBus.publish('favorite.toggled', { userId: id, isFavorite: res.data.is_favorite });
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    // Iterator pattern — wrap the match list for sequential access
    const matchIterator = new MatchIterator(matches);
    const topMatches = matchIterator.toArray().slice(0, 3);
    const allMatches = matchIterator.toArray();
    const topScore = matches.length ? Math.max(...matches.map(m => m.compatibilityScore || 0)) : 0;
    const highCompat = matches.filter(m => (m.compatibilityScore || 0) >= 70).length;
    const avgScore = matches.length ? Math.round(matches.reduce((s, m) => s + (m.compatibilityScore || 0), 0) / matches.length) : 0;

    // Template pattern — render callbacks for the ProfileCardTemplate
    const renderBadge = (p) =>
        p.compatibilityScore ? <span className="fd-card-badge">{p.compatibilityScore}% Match</span> : null;

    const renderTopMeta = (p) => (
        <>
            {p.location && <p className="fd-card-meta">📍 {p.location}</p>}
            {p.education && <p className="fd-card-meta">🎓 {p.education}</p>}
            {p.bio && <p className="fd-card-meta">💼 {p.bio}</p>}
            <div className="fd-card-reason">
                <div className="fd-reason-title">Why this match:</div>
                <div className="fd-reason-text">{p.matchReason || "Based on your shared interests and preferences"}</div>
            </div>
            <button className="fd-view-btn" onClick={() => navigate(`/profile/${p.id}`)}>View Profile</button>
        </>
    );

    const renderGridMeta = (p) => (
        <>
            {p.location && <p className="fd-card-meta">📍 {p.location}</p>}
            {p.bio && <p className="fd-card-meta">💼 {p.bio}</p>}
            <button className="fd-view-btn" onClick={() => navigate(`/profile/${p.id}`)}>View Profile</button>
        </>
    );

    if (loading) return <div className="fd-loading"><div className="fd-spinner" /></div>;

    return (
        <div className="fd-wrap">
            <h2 className="fd-main-title">✨ AI Recommended Matches ✨</h2>
            <p className="fd-subtitle">Personalized matches ranked by compatibility with your preferences</p>

            <div className="fd-stats">
                <div className="fd-stat"><div className="fd-stat-num">{topScore}%</div><div className="fd-stat-label">Top Match Score</div></div>
                <div className="fd-stat"><div className="fd-stat-num fd-stat-num--green">{highCompat}</div><div className="fd-stat-label">High Compatibility (70%+)</div></div>
                <div className="fd-stat"><div className="fd-stat-num">{avgScore}%</div><div className="fd-stat-label">Average Match Score</div></div>
            </div>

            {topMatches.length > 0 && (
                <>
                    <h3 className="fd-section-title">🏆 Top 3 Matches</h3>
                    <div className="fd-top3">
                        {/* Template pattern — fixed card skeleton, variable render slots */}
                        {topMatches.map((m, i) => (
                            <ProfileCardTemplate
                                key={m.id}
                                profile={m}
                                index={i}
                                className="fd-card"
                                style={{ animationDelay: `${i * 0.1}s` }}
                                renderBadge={renderBadge}
                                renderMeta={renderTopMeta}
                                onFavorite={toggleFavorite}
                                isFavorite={favorites.has(m.id)}
                            />
                        ))}
                    </div>
                </>
            )}

            <h3 className="fd-section-title" style={{ marginTop: 32 }}>All Recommended Matches</h3>
            {allMatches.length === 0 ? (
                <div className="fd-empty"><span style={{ fontSize: 40 }}>💔</span><p>No matches found. Broaden your preferences!</p></div>
            ) : (
                <div className="fd-grid">
                    {allMatches.map((m, i) => (
                        <ProfileCardTemplate
                            key={m.id}
                            profile={m}
                            index={i}
                            className="fd-card"
                            renderBadge={renderBadge}
                            renderMeta={renderGridMeta}
                            onFavorite={toggleFavorite}
                            isFavorite={favorites.has(m.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};