import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { createFavoritesSetFromFeedRows } from '../features/favorites/favoriteIdsFromFeed';
import './Feed.css';

import { adaptFeedProfile } from '../patterns/ApiResponseAdapter';
import { MatchIterator } from '../patterns/MatchIterator';
import { eventBus } from '../patterns/EventBus';
import { ProfileCardTemplate } from '../patterns/ProfileCardTemplate';

export const Feed = () => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [favorites, setFavorites] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const r = await api.get('accounts/feed/');
                const rows = Array.isArray(r.data) ? r.data : [];
                setFavorites(createFavoritesSetFromFeedRows(rows));
                const adapted = rows.map(adaptFeedProfile);
                setMatches(adapted);
            } catch (e) {
                console.error(e);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const toggleFavorite = async (id) => {
        const targetId = Number(id);
        if (Number.isNaN(targetId)) return;
        try {
            const res = await api.post('accounts/favorites/toggle/', { target_id: targetId });
            setFavorites((prev) => {
                const next = new Set(prev);
                if (res.data.is_favorite) next.add(targetId);
                else next.delete(targetId);
                return next;
            });
            eventBus.publish('favorite.toggled', { userId: id, isFavorite: res.data.is_favorite });
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const matchIterator = new MatchIterator(matches);
    const topMatches = matchIterator.toArray().slice(0, 3);
    const allMatches = matchIterator.toArray();
    const topScore = matches.length ? Math.max(...matches.map((m) => m.compatibilityScore || 0)) : 0;
    const highCompat = matches.filter((m) => (m.compatibilityScore || 0) >= 70).length;
    const avgScore = matches.length
        ? Math.round(matches.reduce((s, m) => s + (m.compatibilityScore || 0), 0) / matches.length)
        : 0;

    const renderBadge = (p) =>
        p.compatibilityScore ? <span className="fd-card-badge">{p.compatibilityScore}% Match</span> : null;

    const renderTopMeta = (p) => (
        <>
            {p.location && <p className="fd-card-meta">📍 {p.location}</p>}
            {p.education && <p className="fd-card-meta">🎓 {p.education}</p>}
            {p.bio && <p className="fd-card-meta">💼 {p.bio}</p>}
            <div className="fd-card-reason">
                <div className="fd-reason-title">Why this match:</div>
                <div className="fd-reason-text">{p.matchReason || 'Based on your shared interests and preferences'}</div>
            </div>
            <button type="button" className="fd-view-btn" onClick={() => navigate(`/profile/${p.id}`)}>
                View Profile
            </button>
        </>
    );

    const renderGridMeta = (p) => (
        <>
            {p.location && <p className="fd-card-meta">📍 {p.location}</p>}
            {p.bio && <p className="fd-card-meta">💼 {p.bio}</p>}
            <button type="button" className="fd-view-btn" onClick={() => navigate(`/profile/${p.id}`)}>
                View Profile
            </button>
        </>
    );

    if (loading) return <div className="fd-loading"><div className="fd-spinner" /></div>;

    return (
        <div className="fd-wrap">
            <h2 className="fd-main-title">✨ AI Recommended Matches ✨</h2>
            <p className="fd-subtitle">Personalized matches ranked by compatibility with your preferences</p>

            <div className="fd-stats">
                <div className="fd-stat">
                    <div className="fd-stat-num">{topScore}%</div>
                    <div className="fd-stat-label">Top Match Score</div>
                </div>
                <div className="fd-stat">
                    <div className="fd-stat-num fd-stat-num--green">{highCompat}</div>
                    <div className="fd-stat-label">High Compatibility (70%+)</div>
                </div>
                <div className="fd-stat">
                    <div className="fd-stat-num">{avgScore}%</div>
                    <div className="fd-stat-label">Average Match Score</div>
                </div>
            </div>

            {topMatches.length > 0 && (
                <>
                    <h3 className="fd-section-title">🏆 Top 3 Matches</h3>
                    <div className="fd-top3">
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
                                isFavorite={favorites.has(Number(m.id))}
                            />
                        ))}
                    </div>
                </>
            )}

            <h3 className="fd-section-title" style={{ marginTop: 32 }}>
                All Recommended Matches
            </h3>
            {allMatches.length === 0 ? (
                <div className="fd-empty">
                    <span style={{ fontSize: 40 }}>💔</span>
                    <p>No matches found. Broaden your preferences!</p>
                </div>
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
                            isFavorite={favorites.has(Number(m.id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
