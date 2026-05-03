import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { createFavoritesSetFromFeedRows } from '../features/favorites/favoriteIdsFromFeed';
import { useCatalogMetadata } from '../hooks/useCatalogMetadata';
import { OptionIterator } from '../catalog/OptionIterator';
import './SearchPage.css';

import { adaptFeedProfile } from '../patterns/ApiResponseAdapter';
import { buildSearchFilters } from '../patterns/FilterComposite';
import { MatchIterator } from '../patterns/MatchIterator';
import { eventBus } from '../patterns/EventBus';
import { ProfileCardTemplate } from '../patterns/ProfileCardTemplate';

function selectOptionsFromIterator(items) {
    const nodes = [];
    const iter = new OptionIterator(items || []);
    let step = iter.next();
    while (!step.done) {
        const v = step.value;
        nodes.push(
            <option key={v} value={v}>
                {v}
            </option>,
        );
        step = iter.next();
    }
    return nodes;
}

export const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filterState, setFilterState] = useState({ location: '', sect: '', caste: '', education: '' });
    const [favorites, setFavorites] = useState(new Set());
    const [loadError, setLoadError] = useState('');
    const navigate = useNavigate();

    const { data: catalogData, loading: catalogLoading, error: catalogError } = useCatalogMetadata();
    const catalogFilters = catalogData?.filters;

    const filterLists = useMemo(
        () => ({
            locations: catalogFilters?.locations ?? [],
            sects: catalogFilters?.sects ?? [],
            castes: catalogFilters?.caste ?? [],
            education: catalogFilters?.education ?? [],
        }),
        [catalogFilters],
    );

    useEffect(() => {
        const fetchData = async () => {
            setLoadError('');
            if (!localStorage.getItem('access_token')) {
                setLoadError('You need to be logged in to search.');
                return;
            }
            try {
                const res = await api.get('accounts/search/users/', { params: { limit: 500 } });
                const raw = res.data;
                const data = Array.isArray(raw) ? raw : Array.isArray(raw?.results) ? raw.results : [];
                if (!Array.isArray(raw) && !Array.isArray(raw?.results)) {
                    console.warn('Unexpected search API shape', raw);
                }
                setFavorites(createFavoritesSetFromFeedRows(data));
                const adapted = data.map(adaptFeedProfile);
                setProfiles(adapted);
                setFiltered(adapted);
            } catch (e) {
                console.error(e);
                const status = e.response?.status;
                const detail = e.response?.data?.detail;
                if (status === 401 || status === 403) {
                    setLoadError('Session expired or not allowed. Log in again and retry.');
                } else if (status === 404) {
                    setLoadError('Search API not found. Restart the backend and confirm it includes search/users/.');
                } else {
                    setLoadError(
                        typeof detail === 'string'
                            ? detail
                            : 'Could not load profiles. Check that the backend is running and you are logged in.',
                    );
                }
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        const filterTree = buildSearchFilters(filterState, query);
        setFiltered(filterTree.apply(profiles));
    }, [query, filterState, profiles]);

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

    const matchIterator = new MatchIterator(filtered);
    const displayList = matchIterator.toArray();

    const renderBadge = (p) =>
        p.compatibilityScore ? (
            <span className="sp-compat-tag sp-compat-tag--red">{p.compatibilityScore}%</span>
        ) : null;

    const renderMeta = (p) => (
        <>
            {p.location && <div className="sp-profile-meta">📍 {p.location}</div>}
            {p.education && <div className="sp-profile-meta">🎓 {p.education}</div>}
            {p.bio && <div className="sp-profile-meta">💼 {p.bio}</div>}
            {p.compatibilityScore ? <div className="sp-compat-tags">{renderBadge(p)}</div> : null}
            <button type="button" className="sp-view-btn" onClick={() => navigate(`/profile/${p.id}`)}>
                View Profile
            </button>
        </>
    );

    return (
        <div className="sp-wrap">
            <div className="sp-searchbar">
                <svg
                    className="sp-search-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#999"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                    className="sp-input"
                    type="text"
                    placeholder="Search by name, email, username, or user id…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

            {loadError ? (
                <p className="sp-banner sp-banner--warn" role="alert">
                    {loadError}
                </p>
            ) : null}
            {catalogError ? (
                <p className="sp-banner sp-banner--warn" role="alert">
                    Filters could not be loaded; narrow results with search only.
                </p>
            ) : null}
            {catalogLoading && !catalogData ? <p className="sp-banner">Loading filters…</p> : null}

            <div className="sp-filters-card">
                <div className="sp-filters-header">
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#8B1A1A"
                        strokeWidth="2"
                    >
                        <line x1="4" y1="6" x2="20" y2="6" />
                        <line x1="4" y1="12" x2="20" y2="12" />
                        <line x1="4" y1="18" x2="20" y2="18" />
                        <circle cx="8" cy="6" r="2" fill="#8B1A1A" />
                        <circle cx="16" cy="12" r="2" fill="#8B1A1A" />
                        <circle cx="10" cy="18" r="2" fill="#8B1A1A" />
                    </svg>
                    <span>Filters</span>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Location</label>
                    <select
                        className="sp-select"
                        value={filterState.location}
                        onChange={(e) => setFilterState({ ...filterState, location: e.target.value })}
                    >
                        <option value="">Select location</option>
                        {selectOptionsFromIterator(filterLists.locations)}
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Sect</label>
                    <select
                        className="sp-select"
                        value={filterState.sect}
                        onChange={(e) => setFilterState({ ...filterState, sect: e.target.value })}
                    >
                        <option value="">Select sect</option>
                        {selectOptionsFromIterator(filterLists.sects)}
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Caste</label>
                    <select
                        className="sp-select"
                        value={filterState.caste}
                        onChange={(e) => setFilterState({ ...filterState, caste: e.target.value })}
                    >
                        <option value="">Select caste</option>
                        {selectOptionsFromIterator(filterLists.castes)}
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Education Status</label>
                    <select
                        className="sp-select"
                        value={filterState.education}
                        onChange={(e) => setFilterState({ ...filterState, education: e.target.value })}
                    >
                        <option value="">Select education level</option>
                        {selectOptionsFromIterator(filterLists.education)}
                    </select>
                </div>

                <button
                    type="button"
                    className="sp-apply-btn"
                    onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}
                >
                    Apply Filters
                </button>
            </div>

            <h3 className="sp-browse-title">Browse Profiles</h3>
            {displayList.length === 0 ? (
                <div className="sp-empty">
                    <span style={{ fontSize: 40 }}>🔍</span>
                    <p>No profiles found. Try different filters.</p>
                </div>
            ) : (
                <div className="sp-grid">
                    {displayList.map((p, i) => (
                        <ProfileCardTemplate
                            key={p.id}
                            profile={p}
                            index={i}
                            className="sp-profile-card"
                            renderMeta={renderMeta}
                            onFavorite={toggleFavorite}
                            isFavorite={favorites.has(Number(p.id))}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
