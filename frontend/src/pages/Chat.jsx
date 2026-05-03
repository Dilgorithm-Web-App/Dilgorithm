import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import { useChatWebSocket } from '../chat/useChatWebSocket';
import { ConnectionState } from '../chat/ws/connectionState';
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

    const [toastMsg, setToastMsg] = useState('');
    const activeContact = useMemo(
        () => contacts.find((c) => Number(c.id) === contactId),
        [contacts, contactId],
    );

    const displayName =
        activeContact?.fullName ||
        activeContact?.username ||
        activeContact?.email ||
        (roomName ? roomName.replace(/^room_/, 'Chat ') : 'Chat');
    const headerStatus = activeContact?.status || 'Tap to chat';
    const headerPhotoSrc = getProfilePhotoImgSrc(activeContact?.images);

    const loadMessages = useCallback(async () => {
        if (!contactId) return;
        try {
            const { data } = await api.get(`accounts/chat/messages/${contactId}/`);
            const rows = Array.isArray(data) ? data : [];
            setMessages(rows);
            setError('');
        } catch {
            setError('Could not load chat messages.');
        }
    }, [contactId]);

    useEffect(() => {
        const loadContacts = async () => {
            try {
                const { data } = await api.get('accounts/chat/contacts/');
                setContacts(Array.isArray(data) ? data : []);
            } catch {
                setError('Could not load chat contacts.');
            }
        };
        loadContacts();
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const onWsMessage = useCallback((row) => {
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    }, []);

    const { connectionState, sendText } = useChatWebSocket({
        roomName: roomName || '',
        enabled: Boolean(contactId && roomName),
        onMessage: onWsMessage,
        onOpen: () => {
            setError('');
            loadMessages();
        },
        onError: (detail) => {
            if (detail) setError(detail);
        },
    });

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, roomName]);

    const send = (e) => {
        e.preventDefault();
        const text = input.trim();
        if (!text || !contactId) return;

        const ok = sendText(text);
        if (ok) {
            setInput('');
            setError('');
        } else {
            setError('Not connected. Wait for chat to reconnect, then try again.');
        }
    };

    const wsStatus =
        connectionState === ConnectionState.RECONNECTING
            ? 'Reconnecting…'
            : connectionState === ConnectionState.CONNECTING
              ? 'Connecting…'
              : connectionState === ConnectionState.ERROR
                ? 'Connection error'
                : null;

    return (
        <div className="ch-layout">
            <div className="ch-contacts">
                <h4 className="ch-contacts-title">Messages</h4>
                {contacts.map((c) => (
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
                        <div className="ch-contact-av">
                            <img src={getProfilePhotoImgSrc(c.images)} alt="" className="ch-contact-av-img" />
                        </div>
                        <div className="ch-contact-info">
                            <div className="ch-contact-name">{c.fullName || c.username || c.email}</div>
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
                        <div className="ch-header-av">
                            <img src={headerPhotoSrc} alt="" className="ch-header-av-img" />
                        </div>
                        <div>
                            <div className="ch-header-name">{displayName}</div>
                            <div className="ch-header-status">{headerStatus}</div>
                            {wsStatus ? <div className="ch-ws-status">{wsStatus}</div> : null}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="ch-add-family"
                        onClick={() => {
                            setToastMsg(`Family invite sent to ${displayName}!`);
                            setTimeout(() => setToastMsg(''), 3000);
                        }}
                    >
                        ADD FAMILY
                    </button>
                </div>

                <div className="ch-messages">
                    {error ? <p className="ch-error">{error}</p> : null}
                    {toastMsg ? (
                        <div
                            style={{
                                background: '#4CAF50',
                                color: 'white',
                                padding: '10px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                marginBottom: '10px',
                                animation: 'fadeIn 0.3s ease',
                            }}
                        >
                            {toastMsg}
                        </div>
                    ) : null}
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
