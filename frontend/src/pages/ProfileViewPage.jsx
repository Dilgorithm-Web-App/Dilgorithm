import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './ProfileViewPage.css';

const COLORS = ['#E57373','#64B5F6','#81C784','#BA68C8','#FFB74D','#4DD0E1'];

export const ProfileViewPage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isFav, setIsFav] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [toast, setToast] = useState('');
    const [reportModal, setReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get(`accounts/user/${userId}/`);
                setProfile(data);
                setIsFav(data.is_favorite || false);
                setIsBlocked(Boolean(data.is_blocked));
            } catch { setProfile(null); }
            setLoading(false);
        };
        load();
    }, [userId]);

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const toggleFav = async () => {
        try {
            const { data } = await api.post('accounts/favorites/toggle/', { target_id: Number(userId) });
            setIsFav(data.is_favorite);
            showToast(data.is_favorite ? 'Added to favorites ♥' : 'Removed from favorites');
        } catch { showToast('Could not update favorites'); }
    };

    const toggleBlock = async () => {
        try {
            const { data } = await api.post('accounts/block/', { target_id: Number(userId) });
            setIsBlocked(data.is_blocked);
            showToast(data.is_blocked ? 'User blocked' : 'User unblocked');
        } catch { showToast('Could not update block status'); }
    };

    const submitReport = async () => {
        if (!reportReason.trim()) return;
        try {
            await api.post('accounts/report/', { reported_user_id: Number(userId), reason: reportReason });
            showToast('Report submitted. Thank you.');
            setReportModal(false);
            setReportReason('');
        } catch { showToast('Could not submit report'); }
    };

    if (loading) return <div className="pv-loading"><div className="pv-spinner" /></div>;
    if (!profile) return <div className="pv-wrap"><div className="pv-card"><p className="pv-empty">User not found.</p><button className="pv-back" onClick={() => navigate(-1)}>← Go Back</button></div></div>;

    const name = profile.fullName || profile.username || 'User';
    const initial = name[0]?.toUpperCase() || 'U';
    const img = profile.profileImage;
    const color = COLORS[Number(userId) % COLORS.length];

    return (
        <div className="pv-wrap">
            {toast && <div className="pv-toast">{toast}</div>}

            {reportModal && (
                <div className="pv-modal-overlay" onClick={() => setReportModal(false)}>
                    <div className="pv-modal" onClick={e => e.stopPropagation()}>
                        <h3>Report {name}</h3>
                        <textarea className="pv-modal-input" placeholder="Describe the issue..." value={reportReason} onChange={e => setReportReason(e.target.value)} rows={4} />
                        <div className="pv-modal-actions">
                            <button className="pv-btn pv-btn--danger" onClick={submitReport} disabled={!reportReason.trim()}>Submit Report</button>
                            <button className="pv-btn pv-btn--ghost" onClick={() => setReportModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="pv-card">
                <button className="pv-back" onClick={() => navigate(-1)}>← Back</button>

                <div className="pv-hero">
                    {img ? (
                        <img src={img} alt={name} className="pv-photo" />
                    ) : (
                        <div className="pv-avatar" style={{ background: color }}>{initial}</div>
                    )}
                    <h1 className="pv-name">{name}{profile.age ? `, ${profile.age}` : ''}</h1>
                    {profile.is_online && <span className="pv-online-badge">● Online</span>}
                </div>

                <div className="pv-details">
                    {profile.bio && <div className="pv-detail-row"><span className="pv-icon">📝</span><span>{profile.bio}</span></div>}
                    {profile.location && <div className="pv-detail-row"><span className="pv-icon">📍</span><span>{profile.location}</span></div>}
                    {profile.education && <div className="pv-detail-row"><span className="pv-icon">🎓</span><span>{profile.education}</span></div>}
                    {profile.profession && <div className="pv-detail-row"><span className="pv-icon">💼</span><span>{profile.profession}</span></div>}
                    {profile.maritalStatus && <div className="pv-detail-row"><span className="pv-icon">💍</span><span>{profile.maritalStatus}</span></div>}
                    {profile.sect && <div className="pv-detail-row"><span className="pv-icon">🕌</span><span>{profile.sect}</span></div>}
                    {profile.caste && <div className="pv-detail-row"><span className="pv-icon">🏛️</span><span>{profile.caste}</span></div>}
                </div>

                {profile.interestList && profile.interestList.length > 0 && (
                    <div className="pv-interests">
                        <h3 className="pv-section-title">Interests</h3>
                        <div className="pv-tags">
                            {profile.interestList.map(i => <span key={i} className="pv-tag">✨ {i}</span>)}
                        </div>
                    </div>
                )}

                <div className="pv-actions">
                    <button className="pv-btn pv-btn--primary" onClick={() => navigate(`/chat/room_${userId}`)}>
                        💬 Send Message
                    </button>
                    <button className={`pv-btn ${isFav ? 'pv-btn--fav-active' : 'pv-btn--fav'}`} onClick={toggleFav}>
                        {isFav ? '♥ Favorited' : '♡ Favorite'}
                    </button>
                    <button className={`pv-btn ${isBlocked ? 'pv-btn--unblock' : 'pv-btn--block'}`} onClick={toggleBlock}>
                        {isBlocked ? '🔓 Unblock' : '🚫 Block'}
                    </button>
                    <button className="pv-btn pv-btn--report" onClick={() => setReportModal(true)}>
                        ⚠️ Report
                    </button>
                </div>
            </div>
        </div>
    );
};
