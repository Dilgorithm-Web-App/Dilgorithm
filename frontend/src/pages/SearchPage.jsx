import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCatalogMetadata } from '../hooks/useCatalogMetadata';
import { OptionIterator } from '../catalog/OptionIterator';
import { UserCardPhoto } from '../components/UserCard';
import './SearchPage.css';

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
        const fetch = async () => {
            try {
                const res = await api.get('accounts/feed/');
                setProfiles(res.data || []);
                setFiltered(res.data || []);
            } catch (e) {
                console.error(e);
            }
        };
        fetch();
    }, []);

    useEffect(() => {
        let r = profiles;
        if (query.trim()) {
            const q = query.toLowerCase();
            r = r.filter(
                (p) =>
                    (p.fullName || p.username || '').toLowerCase().includes(q) ||
                    (p.bio || '').toLowerCase().includes(q),
            );
        }
        if (filterState.sect)
            r = r.filter((p) => (p.sect || '').toLowerCase().includes(filterState.sect.toLowerCase()));
        if (filterState.location)
            r = r.filter((p) =>
                (p.location || '').toLowerCase().includes(filterState.location.toLowerCase()),
            );
        if (filterState.education)
            r = r.filter((p) =>
                (p.education || '').toLowerCase().includes(filterState.education.toLowerCase()),
            );
        if (filterState.caste)
            r = r.filter((p) => (p.caste || '').toLowerCase().includes(filterState.caste.toLowerCase()));
        setFiltered(r);
    }, [query, filterState, profiles]);

    const toggleFavorite = async (id) => {
        try {
            const res = await api.post('accounts/favorites/toggle/', { target_id: id });
            setFavorites((prev) => {
                const next = new Set(prev);
                if (res.data.is_favorite) next.add(id);
                else next.delete(id);
                return next;
            });
        } catch (err) {
            console.error('Failed to toggle favorite', err);
        }
    };

    const COLORS = [
        'linear-gradient(135deg,#E57373,#EF5350)',
        'linear-gradient(135deg,#64B5F6,#42A5F5)',
        'linear-gradient(135deg,#81C784,#66BB6A)',
        'linear-gradient(135deg,#BA68C8,#AB47BC)',
    ];

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
                    placeholder="Search profiles with names or IDs..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
            </div>

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

                <button type="button" className="sp-apply-btn" onClick={() => window.scrollTo({ top: 400, behavior: 'smooth' })}>
                    Apply Filters
                </button>
            </div>

            <h3 className="sp-browse-title">Browse Profiles</h3>
            {filtered.length === 0 ? (
                <div className="sp-empty">
                    <span style={{ fontSize: 40 }}>🔍</span>
                    <p>No profiles found. Try different filters.</p>
                </div>
            ) : (
                <div className="sp-grid">
                    {filtered.map((p, i) => (
                        <div key={p.id} className="sp-profile-card" style={{ animationDelay: `${i * 0.06}s` }}>
                            <UserCardPhoto profile={p} gradient={COLORS[i % 4]} tall className="sp-profile-photo">
                                <button
                                    type="button"
                                    className="sp-heart-btn"
                                    onClick={() => toggleFavorite(p.id)}
                                    style={{ color: favorites.has(p.id) ? '#E57373' : 'inherit' }}
                                >
                                    {favorites.has(p.id) ? '♥' : '♡'}
                                </button>
                            </UserCardPhoto>
                            <div className="sp-profile-body">
                                <h4 className="sp-profile-name">
                                    {p.fullName || p.username}
                                    {p.age ? `, ${p.age}` : ''}
                                </h4>
                                {p.location && <div className="sp-profile-meta">📍 {p.location}</div>}
                                {p.education && <div className="sp-profile-meta">🎓 {p.education}</div>}
                                {p.bio && <div className="sp-profile-meta">💼 {p.bio}</div>}
                                {p.compatibility_score && (
                                    <div className="sp-compat-tags">
                                        <span className="sp-compat-tag sp-compat-tag--red">{p.compatibility_score}%</span>
                                    </div>
                                )}
                                <button type="button" className="sp-view-btn" onClick={() => navigate(`/chat/room_${p.id}`)}>
                                    View Profile
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
