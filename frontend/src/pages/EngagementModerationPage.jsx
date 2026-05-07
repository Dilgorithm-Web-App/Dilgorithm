import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { eventBus } from '../patterns/EventBus';
import { formatApiError } from '../utils/formatApiError';
import './EngagementModerationPage.css';

function normalizeBlockedPayload(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.results)) return data.results;
    return [];
}

export const EngagementModerationPage = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        sentRequests: 0,
        receivedRequests: 0,
        matchHistory: 0,
        blockedAccounts: 0,
    });
    const [blockedList, setBlockedList] = useState([]);
    const [error, setError] = useState('');
    const [blocksError, setBlocksError] = useState('');
    const [unblockingId, setUnblockingId] = useState(null);

    const loadData = useCallback(async () => {
        setError('');
        setBlocksError('');
        try {
            const { data } = await api.get('accounts/engagement-summary/');
            setSummary({
                sentRequests: data.sentRequests ?? 0,
                receivedRequests: data.receivedRequests ?? 0,
                matchHistory: data.matchHistory ?? 0,
                blockedAccounts: data.blockedAccounts ?? 0,
            });
        } catch (e) {
            setError(formatApiError(e, 'Could not load engagement data from server.'));
        }
        try {
            const { data } = await api.get('accounts/blocked-users/');
            setBlockedList(normalizeBlockedPayload(data));
        } catch (e) {
            setBlocksError(formatApiError(e, 'Could not load blocked accounts.'));
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUnblock = async (targetUserId) => {
        if (unblockingId != null) return;
        setUnblockingId(targetUserId);
        try {
            await api.post('accounts/block/', { target_id: targetUserId });
            setBlockedList((prev) => prev.filter((row) => Number(row.blocked) !== Number(targetUserId)));
            setSummary((s) => ({
                ...s,
                blockedAccounts: Math.max(0, (s.blockedAccounts ?? 0) - 1),
            }));
            eventBus.publish('user.blocked', { userId: targetUserId, isBlocked: false });
        } catch (e) {
            setBlocksError(formatApiError(e, 'Could not unblock this account.'));
        } finally {
            setUnblockingId(null);
        }
    };

    return (
        <div className="em-wrap">
            <div className="em-card">
                <button className="em-back-btn" onClick={() => navigate('/settings')}>
                    ← Back
                </button>
                <h2 className="em-title">Engagement & Moderation</h2>
                <p className="em-subtitle">Manage your interactions and community controls.</p>
                {error ? <p className="em-error">{error}</p> : null}

                <div className="em-row">
                    <span>Sent Requests</span>
                    <span>{summary.sentRequests}</span>
                </div>
                <div className="em-row">
                    <span>Received Requests</span>
                    <span>{summary.receivedRequests}</span>
                </div>
                <div className="em-row">
                    <span>Match History</span>
                    <span>{summary.matchHistory}</span>
                </div>
                <div className="em-row">
                    <span>Blocked Accounts</span>
                    <span>{summary.blockedAccounts}</span>
                </div>

                <section className="em-blocked-section" aria-labelledby="em-blocked-heading">
                    <h3 id="em-blocked-heading" className="em-blocked-title">
                        People you&apos;ve blocked
                    </h3>
                    <p className="em-blocked-hint">
                        Unblocking restores mutual visibility in search, matches, and chat where rules allow.
                    </p>
                    {blocksError ? <p className="em-error">{blocksError}</p> : null}
                    {blockedList.length === 0 && !blocksError ? (
                        <p className="em-blocked-empty">You haven&apos;t blocked anyone.</p>
                    ) : (
                        <ul className="em-blocked-list">
                            {blockedList.map((row) => {
                                const id = Number(row.blocked);
                                const label = row.blockedName || row.blockedUsername || row.blockedEmail || 'User';
                                const busy = unblockingId === id;
                                return (
                                    <li key={row.id ?? `${id}`} className="em-blocked-item">
                                        <div className="em-blocked-meta">
                                            <span className="em-blocked-name">{label}</span>
                                            <span className="em-blocked-email">{row.blockedEmail}</span>
                                        </div>
                                        <button
                                            type="button"
                                            className="em-unblock-btn"
                                            disabled={busy}
                                            aria-label={`Unblock ${label}`}
                                            onClick={() => handleUnblock(id)}
                                        >
                                            {busy ? 'Unblocking…' : 'Unblock'}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};
