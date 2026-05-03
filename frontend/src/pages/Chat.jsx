import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { getProfilePhotoImgSrc } from '../utils/profileImageSrc';
import { useChatWebSocket } from '../chat/useChatWebSocket';
import { ConnectionState } from '../chat/ws/connectionState';
import './Chat.css';

// ── Design Patterns ──
import { adaptChatContact } from '../patterns/ApiResponseAdapter';
import { PageState } from '../patterns/PageState';
import { eventBus } from '../patterns/EventBus';
import { notificationService } from '../patterns/NotificationService';
import { formatApiError } from '../utils/formatApiError';

function parseRoom(name) {
    if (!name || typeof name !== 'string') {
        return { isGroup: false, contactId: null, groupId: null };
    }
    if (name.startsWith('group_')) {
        const id = Number(name.slice(6));
        return { isGroup: true, contactId: null, groupId: Number.isFinite(id) ? id : null };
    }
    if (name.startsWith('room_')) {
        const id = Number(name.slice(5));
        return { isGroup: false, contactId: Number.isFinite(id) ? id : null, groupId: null };
    }
    return { isGroup: false, contactId: null, groupId: null };
}

export const Chat = () => {
    const { roomName } = useParams();
    const { isGroup, contactId, groupId } = useMemo(() => parseRoom(roomName || ''), [roomName]);

    const [contacts, setContacts] = useState([]);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [error, setError] = useState('');
    const [currentUserId, setCurrentUserId] = useState(null);
    const endRef = useRef(null);
    const navigate = useNavigate();

    const [toastMsg, setToastMsg] = useState('');
    const [familyOpen, setFamilyOpen] = useState(false);
    const [familyEmail, setFamilyEmail] = useState('');
    const [familyBusy, setFamilyBusy] = useState(false);
    const [familyErr, setFamilyErr] = useState('');
    const [reportOpen, setReportOpen] = useState(false);
    const [reportReason, setReportReason] = useState('');
    const [reportBusy, setReportBusy] = useState(false);
    const [reportErr, setReportErr] = useState('');
    const [blockBusy, setBlockBusy] = useState(false);
    const [conversationBlocked, setConversationBlocked] = useState(false);
    const [sendState, setSendState] = useState(PageState.idle());

    const activeContact = useMemo(
        () => (!isGroup && contactId ? contacts.find((c) => !c.isGroup && Number(c.id) === contactId) : null),
        [contacts, contactId, isGroup],
    );

    const activeGroupRow = useMemo(
        () => (isGroup && groupId ? contacts.find((c) => c.isGroup && Number(c.id) === groupId) : null),
        [contacts, groupId, isGroup],
    );

    const displayName =
        (isGroup && (activeGroupRow?.fullName || activeGroupRow?.displayName)) ||
        activeContact?.displayName ||
        activeContact?.fullName ||
        activeContact?.username ||
        activeContact?.email ||
        (isGroup ? 'Group chat' : roomName ? roomName.replace(/^room_/, 'Chat ') : 'Chat');

    const headerStatus =
        (isGroup && (activeGroupRow?.status || 'Group conversation')) ||
        activeContact?.status ||
        'Tap to chat';

    const headerPhotoSrc = isGroup
        ? ''
        : getProfilePhotoImgSrc(
              activeContact?.images?.length
                  ? activeContact.images
                  : activeContact?.profileImage
                    ? [activeContact.profileImage]
                    : [],
          );

    const loadMessages = useCallback(async () => {
        if (isGroup) {
            if (!groupId) return;
            try {
                const { data } = await api.get(`accounts/chat/groups/${groupId}/messages/`);
                const rows = Array.isArray(data) ? data : [];
                setMessages(rows);
                setError('');
                setConversationBlocked(false);
            } catch (err) {
                const st = err.response?.status;
                const detail = err.response?.data?.detail;
                if (st === 403 || st === 404) {
                    setConversationBlocked(true);
                    setMessages([]);
                    setError(typeof detail === 'string' ? detail : 'You cannot access this group.');
                } else {
                    setConversationBlocked(false);
                    setError('Could not load group messages.');
                }
            }
            return;
        }
        if (!contactId) return;
        try {
            const { data } = await api.get(`accounts/chat/messages/${contactId}/`);
            const rows = Array.isArray(data) ? data : [];
            setMessages(rows);
            setError('');
            setConversationBlocked(false);
        } catch (err) {
            const st = err.response?.status;
            const detail = err.response?.data?.detail;
            if (st === 403) {
                setConversationBlocked(true);
                setMessages([]);
                setError(typeof detail === 'string' ? detail : 'You cannot chat with this user.');
            } else {
                setConversationBlocked(false);
                setError('Could not load chat messages.');
            }
        }
    }, [isGroup, groupId, contactId]);

    useEffect(() => {
        setConversationBlocked(false);
    }, [roomName]);

    useEffect(() => {
        const loadMe = async () => {
            try {
                const { data } = await api.get('accounts/profile/');
                const uid = data?.userId;
                if (uid != null) setCurrentUserId(Number(uid));
            } catch {
                /* ignore */
            }
        };
        loadMe();
    }, []);

    useEffect(() => {
        const loadSidebar = async () => {
            try {
                const [cRes, gRes] = await Promise.all([
                    api.get('accounts/chat/contacts/'),
                    api.get('accounts/chat/groups/'),
                ]);
                const raw = Array.isArray(cRes.data) ? cRes.data : [];
                const adapted = raw.map(adaptChatContact);
                const directRows = adapted.map((a, i) => ({
                    ...a,
                    ...raw[i],
                    status: raw[i]?.status || 'Tap to chat',
                    isGroup: false,
                    sidebarKey: `u-${raw[i].id}`,
                }));
                const rawG = Array.isArray(gRes.data) ? gRes.data : [];
                const groupRows = rawG.map((g) => ({
                    ...g,
                    isGroup: true,
                    sidebarKey: `g-${g.id}`,
                    images: [],
                    profileImage: null,
                }));
                setContacts([...groupRows, ...directRows]);
            } catch {
                setError('Could not load chat list.');
            }
        };
        loadSidebar();
    }, []);

    useEffect(() => {
        loadMessages();
    }, [loadMessages]);

    const onWsMessage = useCallback((row) => {
        setMessages((prev) => (prev.some((m) => m.id === row.id) ? prev : [...prev, row]));
    }, []);

    const wsEnabled = Boolean(
        roomName && !conversationBlocked && (isGroup ? groupId != null : contactId != null),
    );

    const { connectionState, sendText } = useChatWebSocket({
        roomName: roomName || '',
        enabled: wsEnabled,
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

    useEffect(() => {
        if (activeContact?.email) setFamilyEmail(activeContact.email);
    }, [activeContact?.email]);

    const sendFamilyInvite = async () => {
        if (isGroup || !contactId) {
            setFamilyErr('Family group can only be started from a direct chat.');
            return;
        }
        const email = (familyEmail || '').trim();
        if (!email) {
            setFamilyErr('Enter the member\u2019s email.');
            return;
        }
        setFamilyBusy(true);
        setFamilyErr('');
        try {
            const { data } = await api.post('accounts/chat/groups/family/', {
                contact_user_id: contactId,
                email,
                role: 'Family Member',
            });
            const rn = data?.roomName || (data?.group_id != null ? `group_${data.group_id}` : null);
            notificationService.show('Family group chat created.', 'success');
            setToastMsg('Opening group chat\u2026');
            setFamilyOpen(false);
            if (rn) navigate(`/chat/${rn}`);
            else navigate('/chat-list');
        } catch (err) {
            setFamilyErr(err.response?.data?.detail || 'Could not create group chat.');
        }
        setFamilyBusy(false);
    };

    const submitReport = async () => {
        const reason = (reportReason || '').trim();
        if (!reason) {
            setReportErr('Please describe the issue.');
            return;
        }
        if (!contactId || isGroup) return;
        setReportBusy(true);
        setReportErr('');
        try {
            await api.post('accounts/report/', {
                reported_user_id: Number(contactId),
                reason,
            });
            notificationService.show('Report submitted. Thank you.', 'success');
            setReportOpen(false);
            setReportReason('');
        } catch (err) {
            setReportErr(formatApiError(err, 'Could not submit report.'));
        }
        setReportBusy(false);
    };

    const confirmBlockUser = async () => {
        if (!contactId || isGroup) return;
        const ok = window.confirm(
            `Block ${displayName}? You will not see each other in search, matches, or chat, and neither of you can message the other.`,
        );
        if (!ok) return;
        setBlockBusy(true);
        setError('');
        try {
            await api.post('accounts/block/', { target_id: contactId });
            notificationService.show(`${displayName} has been blocked.`, 'success');
            eventBus.publish('user.blocked', { contactId });
            navigate('/chat-list');
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not block user.');
        }
        setBlockBusy(false);
    };

    const send = (e) => {
        e.preventDefault();
        if (conversationBlocked) return;
        const text = input.trim();
        if (!text || (!contactId && !groupId)) return;

        setSendState(PageState.saving(null));
        const ok = sendText(text);
        if (ok) {
            setInput('');
            setError('');
            eventBus.publish('message.sent', { contactId, groupId, message: text });
            setSendState(PageState.idle());
        } else {
            setError('Not connected. Wait for chat to reconnect, then try again.');
            setSendState(PageState.error('Failed to send'));
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

    const canModerate = Boolean(contactId) && !isGroup;
    const inputDisabled =
        conversationBlocked || sendState.isSaving || connectionState !== ConnectionState.OPEN;

    const sidebarActive = (c) => {
        if (c.isGroup) return roomName === c.roomName || roomName === `group_${c.id}`;
        return roomName === `room_${c.id}`;
    };

    return (
        <div className="ch-layout">
            {reportOpen && (
                <div
                    className="ch-modal-overlay"
                    role="presentation"
                    onClick={() => !reportBusy && setReportOpen(false)}
                >
                    <div className="ch-modal" role="dialog" aria-labelledby="ch-report-title" onClick={(e) => e.stopPropagation()}>
                        <h3 id="ch-report-title" className="ch-modal-title">
                            Report {displayName}
                        </h3>
                        <p className="ch-modal-hint">Moderators will review your report. Be specific and factual.</p>
                        <label className="ch-modal-label" htmlFor="ch-report-reason">
                            Reason
                        </label>
                        <textarea
                            id="ch-report-reason"
                            className="ch-modal-textarea"
                            rows={4}
                            value={reportReason}
                            onChange={(e) => setReportReason(e.target.value)}
                            disabled={reportBusy}
                            placeholder="Describe what happened…"
                        />
                        {reportErr ? <p className="ch-modal-err">{reportErr}</p> : null}
                        <div className="ch-modal-actions">
                            <button
                                type="button"
                                className="ch-modal-btn ch-modal-btn--ghost"
                                disabled={reportBusy}
                                onClick={() => setReportOpen(false)}
                            >
                                Cancel
                            </button>
                            <button type="button" className="ch-modal-btn ch-modal-btn--primary" disabled={reportBusy} onClick={submitReport}>
                                {reportBusy ? 'Submitting\u2026' : 'Submit report'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {familyOpen && (
                <div className="ch-modal-overlay" role="presentation" onClick={() => !familyBusy && setFamilyOpen(false)}>
                    <div className="ch-modal" role="dialog" aria-labelledby="ch-family-title" onClick={(e) => e.stopPropagation()}>
                        <h3 id="ch-family-title" className="ch-modal-title">
                            Add family to group chat
                        </h3>
                        <p className="ch-modal-hint">
                            Creates a <strong>group chat</strong> with you, <strong>{displayName}</strong>, and the person you add (they must already
                            have an account).
                        </p>
                        <label className="ch-modal-label" htmlFor="ch-family-email">
                            Their email
                        </label>
                        <input
                            id="ch-family-email"
                            className="ch-modal-input"
                            type="email"
                            value={familyEmail}
                            onChange={(e) => setFamilyEmail(e.target.value)}
                            disabled={familyBusy}
                        />
                        {familyErr ? <p className="ch-modal-err">{familyErr}</p> : null}
                        <div className="ch-modal-actions">
                            <button type="button" className="ch-modal-btn ch-modal-btn--ghost" disabled={familyBusy} onClick={() => setFamilyOpen(false)}>
                                Cancel
                            </button>
                            <button type="button" className="ch-modal-btn ch-modal-btn--primary" disabled={familyBusy} onClick={sendFamilyInvite}>
                                {familyBusy ? 'Creating\u2026' : 'Create group chat'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="ch-contacts">
                <h4 className="ch-contacts-title">Messages</h4>
                {contacts.map((c) => (
                    <div
                        key={c.sidebarKey}
                        className={`ch-contact ${sidebarActive(c) ? 'ch-contact--active' : ''}`}
                        onClick={() => navigate(`/chat/${c.isGroup ? c.roomName : `room_${c.id}`}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(ev) => {
                            if (ev.key === 'Enter' || ev.key === ' ') {
                                ev.preventDefault();
                                navigate(`/chat/${c.isGroup ? c.roomName : `room_${c.id}`}`);
                            }
                        }}
                    >
                        <div className={`ch-contact-av ${c.isGroup ? 'ch-contact-av--group' : ''}`}>
                            {c.isGroup ? (
                                <span className="ch-contact-av-emoji" aria-hidden>
                                    👥
                                </span>
                            ) : (
                                <img
                                    src={getProfilePhotoImgSrc(
                                        c.images?.length ? c.images : c.profileImage ? [c.profileImage] : [],
                                    )}
                                    alt=""
                                    className="ch-contact-av-img"
                                />
                            )}
                        </div>
                        <div className="ch-contact-info">
                            <div className="ch-contact-name">{c.displayName || c.fullName || c.username || c.email}</div>
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
                        <div className={`ch-header-av ${isGroup ? 'ch-header-av--group' : ''}`}>
                            {isGroup ? (
                                <span className="ch-header-av-emoji" aria-hidden>
                                    👥
                                </span>
                            ) : (
                                <img src={headerPhotoSrc} alt="" className="ch-header-av-img" />
                            )}
                        </div>
                        <div>
                            <div className="ch-header-name">{displayName}</div>
                            <div className="ch-header-status">{headerStatus}</div>
                            {wsStatus ? <div className="ch-ws-status">{wsStatus}</div> : null}
                        </div>
                    </div>
                    <div className="ch-header-right">
                        {canModerate ? (
                            <>
                                <button
                                    type="button"
                                    className="ch-header-action ch-header-action--report"
                                    disabled={blockBusy || reportBusy || conversationBlocked}
                                    onClick={() => {
                                        setReportErr('');
                                        setReportOpen(true);
                                    }}
                                >
                                    Report
                                </button>
                                <button
                                    type="button"
                                    className="ch-header-action ch-header-action--block"
                                    disabled={blockBusy || reportBusy || conversationBlocked}
                                    onClick={confirmBlockUser}
                                >
                                    {blockBusy ? 'Blocking\u2026' : 'Block'}
                                </button>
                            </>
                        ) : null}
                        {!isGroup ? (
                            <button
                                type="button"
                                className="ch-add-family"
                                onClick={() => {
                                    setFamilyErr('');
                                    setFamilyOpen(true);
                                }}
                            >
                                ADD FAMILY
                            </button>
                        ) : null}
                    </div>
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
                    {messages.map((m) => {
                        const mine = currentUserId != null && Number(m.senderId) === Number(currentUserId);
                        return (
                            <div key={m.id} className={`ch-msg ${mine ? 'ch-msg--sent' : 'ch-msg--recv'}`}>
                                <div className="ch-bubble">{m.message}</div>
                                <div className="ch-time">
                                    {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        );
                    })}
                    <div ref={endRef} />
                </div>

                <form className="ch-input-bar" onSubmit={send}>
                    <input
                        className="ch-input"
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={conversationBlocked ? 'Messaging is blocked.' : 'Message...'}
                        disabled={inputDisabled}
                    />
                    <button type="submit" className="ch-send" disabled={inputDisabled}>
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
