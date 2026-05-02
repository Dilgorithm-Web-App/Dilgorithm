import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './EngagementModerationPage.css';

export const EngagementModerationPage = () => {
    const navigate = useNavigate();
    const [summary, setSummary] = useState({
        sentRequests: 0,
        receivedRequests: 0,
        matchHistory: 0,
        blockedAccounts: 0,
    });
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.get('accounts/engagement-summary/');
                setSummary({
                    sentRequests: data.sentRequests ?? 0,
                    receivedRequests: data.receivedRequests ?? 0,
                    matchHistory: data.matchHistory ?? 0,
                    blockedAccounts: data.blockedAccounts ?? 0,
                });
            } catch (e) {
                setError('Could not load engagement data from server.');
            }
        };
        fetchSummary();
    }, []);

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
            </div>
        </div>
    );
};
