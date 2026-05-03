import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './AdminDashboard.css';

// ── Design Patterns ──
// Factory pattern: tab configuration drives the UI uniformly (OCP).
// Observer pattern: toast notifications react to action events.

/**
 * Factory pattern — tab definitions. Adding a new tab requires only
 * appending to this array (Open/Closed Principle).
 */
const TAB_CONFIG = [
    { key: 'reports', label: 'Pending Reports' },
    { key: 'blocklist', label: 'Block List' },
];

/**
 * Admin Moderation Dashboard — accessible only to is_staff / is_superuser.
 *
 * Two tabs:
 *   1. Pending Reports — review and approve/dismiss user reports.
 *   2. Block List — view all current blocks system-wide.
 */
export const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('reports');
    const [reports, setReports] = useState([]);
    const [blocklist, setBlocklist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [resolving, setResolving] = useState(null); // report id being resolved
    const [toast, setToast] = useState(null);

    // ── Fetch data ──
    const fetchReports = useCallback(async () => {
        try {
            const { data } = await api.get('accounts/admin/reports/');
            setReports(data);
        } catch (e) {
            if (e.response?.status === 403) {
                setError('Access denied. Admin privileges required.');
            } else {
                setError('Failed to load reports.');
            }
        }
    }, []);

    const fetchBlocklist = useCallback(async () => {
        try {
            const { data } = await api.get('accounts/admin/blocklist/');
            setBlocklist(data);
        } catch {
            // Non-critical — reports tab is primary
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError('');
            await Promise.all([fetchReports(), fetchBlocklist()]);
            setLoading(false);
        };
        load();
    }, [fetchReports, fetchBlocklist]);

    // ── Resolve report ──
    const resolveReport = async (reportId, action) => {
        setResolving(reportId);
        try {
            const { data } = await api.post(
                `accounts/admin/reports/${reportId}/resolve/`,
                { action },
            );
            showToast(data.detail || `Report ${action}d.`, 'success');
            // Refresh both lists (approve may add to block list)
            await Promise.all([fetchReports(), fetchBlocklist()]);
        } catch (e) {
            showToast(
                e.response?.data?.detail || `Failed to ${action} report.`,
                'error',
            );
        } finally {
            setResolving(null);
        }
    };

    // ── Toast ──
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Helpers ──
    const formatDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // ── Render ──
    return (
        <div className="ad-wrap">
            {/* Header */}
            <div className="ad-header">
                <button className="ad-back-btn" onClick={() => navigate('/settings')}>
                    ← Back
                </button>
                <h2 className="ad-title">
                    <span className="ad-title-icon">🛡️</span>
                    Admin Moderation
                </h2>
            </div>

            {/* Tabs */}
            <div className="ad-tabs">
                {TAB_CONFIG.map((tab) => (
                    <button
                        key={tab.key}
                        className={`ad-tab ${activeTab === tab.key ? 'ad-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                        {tab.key === 'reports' && (
                            <span className="ad-badge">{reports.length}</span>
                        )}
                        {tab.key === 'blocklist' && (
                            <span className="ad-badge">{blocklist.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            {loading ? (
                <div className="ad-panel">
                    <div className="ad-loading">
                        <div className="ad-spinner" />
                        <div>Loading moderation data…</div>
                    </div>
                </div>
            ) : error ? (
                <div className="ad-panel">
                    <div className="ad-error">{error}</div>
                </div>
            ) : activeTab === 'reports' ? (
                <ReportsTable
                    reports={reports}
                    resolving={resolving}
                    onResolve={resolveReport}
                    formatDate={formatDate}
                />
            ) : (
                <BlocklistTable blocklist={blocklist} formatDate={formatDate} />
            )}

            {/* Toast */}
            {toast && (
                <div className={`ad-toast ad-toast--${toast.type}`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
};

/* ──────────────────────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────────────────────── */

const ReportsTable = ({ reports, resolving, onResolve, formatDate }) => {
    if (reports.length === 0) {
        return (
            <div className="ad-panel">
                <div className="ad-empty">
                    <div className="ad-empty-icon">✅</div>
                    No pending reports — all clear!
                </div>
            </div>
        );
    }

    return (
        <div className="ad-panel">
            <div className="ad-table-scroll">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Reporter</th>
                            <th>Reported User</th>
                            <th>Reason</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((r) => (
                            <tr key={r.id}>
                                <td>
                                    <div className="ad-user-info">
                                        <span className="ad-user-name">{r.reporterName}</span>
                                        <span className="ad-user-email">{r.reporterEmail}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="ad-user-info">
                                        <span className="ad-user-name">{r.reportedName}</span>
                                        <span className="ad-user-email">{r.reportedEmail}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="ad-reason" title={r.reason}>
                                        {r.reason}
                                    </span>
                                </td>
                                <td>
                                    <span className="ad-date">{formatDate(r.createdAt)}</span>
                                </td>
                                <td>
                                    <div className="ad-actions">
                                        <button
                                            className="ad-btn ad-btn--approve"
                                            disabled={resolving === r.id}
                                            onClick={() => onResolve(r.id, 'approve')}
                                        >
                                            {resolving === r.id ? '…' : '✓ Approve'}
                                        </button>
                                        <button
                                            className="ad-btn ad-btn--dismiss"
                                            disabled={resolving === r.id}
                                            onClick={() => onResolve(r.id, 'dismiss')}
                                        >
                                            Dismiss
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const BlocklistTable = ({ blocklist, formatDate }) => {
    if (blocklist.length === 0) {
        return (
            <div className="ad-panel">
                <div className="ad-empty">
                    <div className="ad-empty-icon">🔓</div>
                    No users are currently blocked.
                </div>
            </div>
        );
    }

    return (
        <div className="ad-panel">
            <div className="ad-table-scroll">
                <table className="ad-table">
                    <thead>
                        <tr>
                            <th>Blocker</th>
                            <th>Blocked User</th>
                            <th>Blocked Since</th>
                        </tr>
                    </thead>
                    <tbody>
                        {blocklist.map((b) => (
                            <tr key={b.id}>
                                <td>
                                    <div className="ad-user-info">
                                        <span className="ad-user-name">{b.blockerName}</span>
                                        <span className="ad-user-email">{b.blockerEmail}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="ad-user-info">
                                        <span className="ad-user-name">{b.blockedName}</span>
                                        <span className="ad-user-email">{b.blockedEmail}</span>
                                    </div>
                                </td>
                                <td>
                                    <span className="ad-date">{formatDate(b.createdAt)}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
