import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './SearchPage.css';

export const SearchPage = () => {
    const [query, setQuery] = useState('');
    const [profiles, setProfiles] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filters, setFilters] = useState({ location: '', sect: '', caste: '', education: '' });
    const [favorites, setFavorites] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await api.get('accounts/feed/');
                setProfiles(res.data || []);
                setFiltered(res.data || []);
            } catch (e) { console.error(e); }
        };
        fetch();
    }, []);

    useEffect(() => {
        let r = profiles;
        if (query.trim()) {
            const q = query.toLowerCase();
            r = r.filter(p => (p.fullName || p.username || '').toLowerCase().includes(q) || (p.bio || '').toLowerCase().includes(q));
        }
        if (filters.sect) r = r.filter(p => (p.sect || '').toLowerCase().includes(filters.sect.toLowerCase()));
        if (filters.location) r = r.filter(p => (p.location || '').toLowerCase().includes(filters.location.toLowerCase()));
        if (filters.education) r = r.filter(p => (p.education || '').toLowerCase().includes(filters.education.toLowerCase()));
        if (filters.caste) r = r.filter(p => (p.caste || '').toLowerCase().includes(filters.caste.toLowerCase()));
        setFiltered(r);
    }, [query, filters, profiles]);

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

    const COLORS = ['linear-gradient(135deg,#E57373,#EF5350)', 'linear-gradient(135deg,#64B5F6,#42A5F5)', 'linear-gradient(135deg,#81C784,#66BB6A)', 'linear-gradient(135deg,#BA68C8,#AB47BC)'];

    return (
        <div className="sp-wrap">
            {/* Search Bar */}
            <div className="sp-searchbar">
                <svg className="sp-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input className="sp-input" type="text" placeholder="Search profiles with names or IDs..." value={query} onChange={e => setQuery(e.target.value)} />
            </div>

            {/* Filters Card */}
            <div className="sp-filters-card">
                <div className="sp-filters-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8B1A1A" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="8" cy="6" r="2" fill="#8B1A1A"/><circle cx="16" cy="12" r="2" fill="#8B1A1A"/><circle cx="10" cy="18" r="2" fill="#8B1A1A"/></svg>
                    <span>Filters</span>
                </div>

                <div className="sp-filter-group">
                    <label className="sp-label">Location</label>
                    <select className="sp-select" value={filters.location} onChange={e => setFilters({...filters, location: e.target.value})}>
                        <option value="">Select location</option>
                        <option value="Karachi">Karachi</option>
                        <option value="Lahore">Lahore</option>
                        <option value="Islamabad">Islamabad</option>
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Sect</label>
                    <select className="sp-select" value={filters.sect} onChange={e => setFilters({...filters, sect: e.target.value})}>
                        <option value="">Select sect</option>
                        <option value="Sunni">Sunni</option>
                        <option value="Shia">Shia</option>
                        <option value="Just Muslim">Just Muslim</option>
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Caste</label>
                    <select className="sp-select" value={filters.caste} onChange={e => setFilters({...filters, caste: e.target.value})}>
                        <option value="">Select caste</option>
                        <option value="Syed">Syed</option>
                        <option value="Rajput">Rajput</option>
                        <option value="Arain">Arain</option>
                        <option value="Jat">Jat</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div className="sp-filter-group">
                    <label className="sp-label">Education Status</label>
                    <select className="sp-select" value={filters.education} onChange={e => setFilters({...filters, education: e.target.value})}>
                        <option value="">Select education level</option>
                        <option value="bachelors">Bachelors</option>
                        <option value="masters">Masters</option>
                        <option value="phd">PhD</option>
                    </select>
                </div>

                <button className="sp-apply-btn" onClick={() => {}}>Apply Filters</button>
            </div>

            {/* Browse Profiles */}
            <h3 className="sp-browse-title">Browse Profiles</h3>
            {filtered.length === 0 ? (
                <div className="sp-empty">
                    <span style={{ fontSize: 40 }}>🔍</span>
                    <p>No profiles found. Try different filters.</p>
                </div>
            ) : (
                <div className="sp-grid">
                    {filtered.map((p, i) => (
                        <div key={p.id} className="sp-profile-card" style={{ animationDelay: `${i * .06}s` }}>
                            <div className="sp-profile-photo" style={{ background: COLORS[i % 4] }}>
                                <span className="sp-profile-initial">{(p.fullName || p.username || 'U')[0].toUpperCase()}</span>
                                <button className="sp-heart-btn" onClick={() => toggleFavorite(p.id)} style={{ color: favorites.has(p.id) ? '#E57373' : 'inherit' }}>
                                    {favorites.has(p.id) ? '♥' : '♡'}
                                </button>
                            </div>
                            <div className="sp-profile-body">
                                <h4 className="sp-profile-name">{p.fullName || p.username}{p.age ? `, ${p.age}` : ''}</h4>
                                {p.location && <div className="sp-profile-meta">📍 {p.location}</div>}
                                {p.education && <div className="sp-profile-meta">🎓 {p.education}</div>}
                                {p.bio && <div className="sp-profile-meta">💼 {p.bio}</div>}
                                {p.compatibility_score && (
                                    <div className="sp-compat-tags">
                                        <span className="sp-compat-tag sp-compat-tag--red">{p.compatibility_score}%</span>
                                    </div>
                                )}
                                <button className="sp-view-btn" onClick={() => navigate(`/chat/room_${p.id}`)}>View Profile</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
