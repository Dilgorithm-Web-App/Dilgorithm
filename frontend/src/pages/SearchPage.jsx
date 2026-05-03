import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCatalogMetadata } from '../hooks/useCatalogMetadata';
import { OptionIterator } from '../catalog/OptionIterator';
import { buildProfileSearchParams } from '../features/search/profileSearchParamsFactory';
import './SearchPage.css';

import { adaptFeedProfile } from '../patterns/ApiResponseAdapter';
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

const PAGE_SIZE = 20;

export const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [filterState, setFilterState] = useState({ location: '', sect: '', caste: '', education: '' });
    const [favorites, setFavorites] = useState(new Set());
    const [resultsLoading, setResultsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(null);
    const [hasNext, setHasNext] = useState(false);
    const [hasPrevious, setHasPrevious] = useState(false);

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

    const handleSearch = useCallback(
        async (pageNum = 1) => {
            setResultsLoading(true);
            setPage(pageNum);
            try {
                const params = buildProfileSearchParams({
                    nameQuery: query,
                    filterState,
                    page: pageNum,
                    pageSize: PAGE_SIZE,
                });
                const res = await api.get('accounts/search/', { params });
                const body = res.data;
                let rows = [];
                if (body && Array.isArray(body.results)) {
                    rows = body.results;
                    setTotalCount(typeof body.count === 'number' ? body.count : rows.length);
                    setHasNext(Boolean(body.next));
                    setHasPrevious(Boolean(body.previous));
                } else if (Array.isArray(body)) {
                    rows = body;
                    setTotalCount(rows.length);
                    setHasNext(false);
                    setHasPrevious(false);
                } else {
                    setTotalCount(0);
                    setHasNext(false);
                    setHasPrevious(false);
                }

                const adapted = rows.map(adaptFeedProfile);
                setProfiles(adapted);
                setFavorites((prev) => {
                    const next = new Set(prev);
                    for (const r of rows) {
                        const id = Number(r.id);
                        if (Number.isNaN(id)) continue;
                        if (r.is_favorite) next.add(id);
                        else next.delete(id);
                    }
                    return next;
                });
            } catch (e) {
                console.error(e);
                setProfiles([]);
                setTotalCount(0);
                setHasNext(false);
                setHasPrevious(false);
            } finally {
                setResultsLoading(false);
            }
        },
        [query, filterState],
    );

    useEffect(() => {
        handleSearch(1);
        // Intentionally run once on mount; further loads use Apply / Enter / pagination.
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const matchIterator = new MatchIterator(profiles);
    const displayList = matchIterator.toArray();

    const totalPages =
        totalCount != null && PAGE_SIZE > 0 ? Math.max(1, Math.ceil(totalCount / PAGE_SIZE)) : null;

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

    const onApplyFilters = () => {
        handleSearch(1);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

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
                    placeholder="Search by display name..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            handleSearch(1);
                        }
                    }}
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
                        <option value="">Any location</option>
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
                        <option value="">Any sect</option>
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
                        <option value="">Any caste</option>
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
                        <option value="">Any education</option>
                        {selectOptionsFromIterator(filterLists.education)}
                    </select>
                </div>

                <button type="button" className="sp-apply-btn" onClick={onApplyFilters} disabled={resultsLoading}>
                    {resultsLoading ? 'Searching…' : 'Search / apply filters'}
                </button>
            </div>

            <h3 className="sp-browse-title">Browse Profiles</h3>

            {resultsLoading ? (
                <div className="sp-loading" role="status" aria-busy="true" aria-live="polite">
                    <div className="sp-spinner" />
                    <p className="sp-loading-text">Searching profiles…</p>
                </div>
            ) : displayList.length === 0 ? (
                <div className="sp-empty">
                    <span style={{ fontSize: 40 }}>🔍</span>
                    <p>No users found matching your criteria.</p>
                    <p style={{ marginTop: 8 }}>Try a different name or clear some filters.</p>
                </div>
            ) : (
                <>
                    {totalPages != null ? (
                        <p style={{ margin: '0 0 12px', color: '#666', fontSize: 14 }}>
                            About {totalCount} result{totalCount === 1 ? '' : 's'}
                            {totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ''}
                        </p>
                    ) : null}
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
                    {(hasPrevious || hasNext) && (
                        <div className="sp-pager">
                            <button
                                type="button"
                                className="sp-pager-btn"
                                disabled={!hasPrevious || resultsLoading}
                                onClick={() => handleSearch(page - 1)}
                            >
                                Previous
                            </button>
                            <span className="sp-pager-status">
                                Page {page}
                                {totalPages != null ? ` / ${totalPages}` : ''}
                            </span>
                            <button
                                type="button"
                                className="sp-pager-btn"
                                disabled={!hasNext || resultsLoading}
                                onClick={() => handleSearch(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
