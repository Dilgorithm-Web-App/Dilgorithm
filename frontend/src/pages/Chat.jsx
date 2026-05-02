import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
<<<<<<< HEAD
=======
import { CHAT_AVATAR_COLORS } from '../data/chatContacts';
>>>>>>> bdf09bd5600ed89b2033b5a3b865a8d3e4f9373d
import './Chat.css';

export const Chat = () => {
    const { roomName } = useParams();
    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const endRef = useRef(null);
    const navigate = useNavigate();
    const contactId = Number((roomName || '').replace('room_', ''));

<<<<<<< HEAD
    const [contacts, setContacts] = useState([]);

    useEffect(() => {
        const fetchContacts = async () => {
            try {
                const res = await api.get('accounts/feed/');
                const data = res.data || [];
                setContacts(data.map(user => ({
                    name: user.fullName || user.username || 'User',
                    status: 'Active recently',
                    id: user.id
                })));
            } catch (err) {
                console.error("Failed to fetch contacts", err);
            }
        };
        fetchContacts();
    }, []);
=======
    const activeContact = useMemo(
        () => contacts.find((c) => Number(c.id) === contactId),
        [contacts, contactId]
    );
>>>>>>> bdf09bd5600ed89b2033b5a3b865a8d3e4f9373d

    const activeIndex = useMemo(
        () => contacts.findIndex((c) => Number(c.id) === contactId),
        [contacts, contactId]
    );

    const headerColor =
        activeIndex >= 0 ? CHAT_AVATAR_COLORS[activeIndex % CHAT_AVATAR_COLORS.length] : CHAT_AVATAR_COLORS[0];
    const displayName = activeContact?.username || activeContact?.email || (roomName ? roomName.replace(/^room_/, 'Chat ') : 'Chat');
    const headerStatus = activeContact?.status || 'Tap to chat';

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const { data } = await api.get('accounts/chat/contacts/');
                setContacts(Array.isArray(data) ? data : []);
            } catch (e) {
                setError('Could not load chat contacts.');
            }
        };
        loadContacts();
    }, []);

    useEffect(() => {
        if (!contactId) return;

        const loadMessages = async () => {
            try {
                const { data } = await api.get(`accounts/chat/messages/${contactId}/`);
                const rows = Array.isArray(data) ? data : [];
                setMessages(rows);
                setError('');
            } catch (e) {
                setError('Could not load chat messages.');
            }
        };

        loadMessages();
        const poll = setInterval(loadMessages, 2500);
        return () => clearInterval(poll);
    }, [contactId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, roomName]);

    const send = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !contactId) return;

        api.post(`accounts/chat/messages/${contactId}/`, { message: text })
            .then(({ data }) => {
                setMessages((prev) => [...prev, data]);
                setInput('');
                setError('');
            })
            .catch((err) => {
                setError(err.response?.data?.detail || 'Failed to send message.');
            });
    };

    return (
        <div className="ch-layout">
            <div className="ch-contacts">
                <h4 className="ch-contacts-title">Messages</h4>
                {contacts.map((c, i) => (
                    <div
                        key={c.id}
                        className={`ch-contact ${contactId === Number(c.id) ? 'ch-contact--active' : ''}`}
                        onClick={() => navigate(`/chat/room_${c.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault();
                                navigate(`/chat/room_${c.id}`);
                            }
                        }}
                    >
                        <div className="ch-contact-av" style={{ background: CHAT_AVATAR_COLORS[i % CHAT_AVATAR_COLORS.length] }}>
                            {(c.username || c.email || 'U')[0]?.toUpperCase()}
                        </div>
                        <div className="ch-contact-info">
                            <div className="ch-contact-name">{c.username || c.email}</div>
                            <div className="ch-contact-status">{c.status}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="ch-main">
                <div className="ch-header">
                    <div className="ch-header-left">
                        <button
                            type="button"
                            className="ch-back-btn"
                            onClick={() => navigate('/chat-list')}
                            aria-label="Back to messages list"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                <path d="M19 12H5M12 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="ch-header-av" style={{ background: headerColor }}>
                            {displayName[0]?.toUpperCase() || 'U'}
                        </div>
                        <div>
                            <div className="ch-header-name">{displayName}</div>
                            <div className="ch-header-status">{headerStatus}</div>
                        </div>
                    </div>
<<<<<<< HEAD
                    <button className="ch-add-family" onClick={() => alert("Family invite sent to your connections!")}>ADD FAMILY</button>
=======
                    <button type="button" className="ch-add-family">
                        ADD FAMILY
                    </button>
>>>>>>> bdf09bd5600ed89b2033b5a3b865a8d3e4f9373d
                </div>

                <div className="ch-messages">
                    {error ? <p className="ch-error">{error}</p> : null}
                    {messages.length === 0 && (
                        <div className="ch-empty">
                            <span style={{ fontSize: 36 }}>💬</span>
                            <p>Start the conversation! Say hello.</p>
                        </div>
                    )}
                    {messages.map((m) => (
                        <div
                            key={m.id}
                            className={`ch-msg ${m.senderId === contactId ? 'ch-msg--recv' : 'ch-msg--sent'}`}
                        >
                            <div className="ch-bubble">{m.message}</div>
                            <div className="ch-time">
                                {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </div>
                    ))}
                    <div ref={endRef} />
                </div>

                <form className="ch-input-bar" onSubmit={send}>
                    <input
                        className="ch-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Message..."
                    />
                    <button type="submit" className="ch-send">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13" />
                            <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                    </button>
                </form>
            </div>
        </div>
    );
};
