import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import './ChatListPage.css';

export const ChatListPage = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const [cRes, gRes] = await Promise.all([
                    api.get('accounts/chat/contacts/'),
                    api.get('accounts/chat/groups/'),
                ]);
                const contacts = Array.isArray(cRes.data) ? cRes.data : [];
                const groups = Array.isArray(gRes.data) ? gRes.data : [];
                const direct = contacts.map((c) => ({
                    ...c,
                    isGroup: false,
                    key: `u-${c.id}`,
                    targetRoom: `room_${c.id}`,
                }));
                const gRows = groups.map((g) => ({
                    ...g,
                    isGroup: true,
                    key: `g-${g.id}`,
                    targetRoom: g.roomName || `group_${g.id}`,
                }));
                setRows([...gRows, ...direct]);
            } catch {
                setError('Could not load conversations.');
            }
        };
        load();
    }, []);

    return (
        <div className="cl-wrap">
            <div className="cl-card">
                <h2 className="cl-title">Messages</h2>
                <p className="cl-subtitle">Pick a conversation to open chat.</p>
                {error ? <p className="cl-error">{error}</p> : null}

                <div className="cl-list">
                    {rows.map((row) => (
                        <button key={row.key} className="cl-item" onClick={() => navigate(`/chat/${row.targetRoom}`)}>
                            <div className={`cl-avatar ${row.isGroup ? 'cl-avatar--group' : ''}`}>
                                {row.isGroup ? (
                                    <span className="cl-avatar-emoji" aria-hidden>
                                        👥
                                    </span>
                                ) : (
                                    <img
                                        src={getProfilePhotoImgSrc(
                                            row.images?.length ? row.images : row.profileImage ? [row.profileImage] : [],
                                        )}
                                        alt=""
                                        className="cl-avatar-img"
                                    />
                                )}
                            </div>
                            <div className="cl-meta">
                                <div className="cl-name">{row.fullName || row.username || row.email}</div>
                                <div className="cl-status">{row.status}</div>
                            </div>
                            <span className="cl-arrow">›</span>
                        </button>
                    ))}
                    {!error && rows.length === 0 ? <p className="cl-empty">No conversations yet.</p> : null}
                </div>
            </div>
        </div>
    );
};
