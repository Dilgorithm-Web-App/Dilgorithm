import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import './ChatListPage.css';

export const ChatListPage = () => {
    const navigate = useNavigate();
    const [contacts, setContacts] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const { data } = await api.get('accounts/chat/contacts/');
                setContacts(Array.isArray(data) ? data : []);
            } catch (e) {
                setError('Could not load contacts.');
            }
        };
        loadContacts();
    }, []);

    return (
        <div className="cl-wrap">
            <div className="cl-card">
                <h2 className="cl-title">Messages</h2>
                <p className="cl-subtitle">Pick a conversation to open chat.</p>
                {error ? <p className="cl-error">{error}</p> : null}

                <div className="cl-list">
                    {contacts.map((contact) => (
                        <button
                            key={contact.id}
                            className="cl-item"
                            onClick={() => navigate(`/chat/room_${contact.id}`)}
                        >
                            <div className="cl-avatar">
                                <img
                                    src={getProfilePhotoImgSrc(
                                        contact.images?.length
                                            ? contact.images
                                            : contact.profileImage
                                              ? [contact.profileImage]
                                              : [],
                                    )}
                                    alt=""
                                    className="cl-avatar-img"
                                />
                            </div>
                            <div className="cl-meta">
                                <div className="cl-name">{contact.fullName || contact.username || contact.email}</div>
                                <div className="cl-status">{contact.status}</div>
                            </div>
                            <span className="cl-arrow">›</span>
                        </button>
                    ))}
                    {!error && contacts.length === 0 ? <p className="cl-empty">No contacts available yet.</p> : null}
                </div>
            </div>
        </div>
    );
};
