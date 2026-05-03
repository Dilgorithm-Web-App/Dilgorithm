import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import dgHeartLogo from '../assets/dg_heart_logo.png';
import './ForgotPasswordPage.css';

export const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const requestCode = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        setMessage('');
        try {
            const { data } = await api.post('accounts/password-reset/request/', { email: email.trim() });
            setMessage(data.detail || 'Check your email for a code.');
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not send reset code.');
        }
        setBusy(false);
    };

    const resetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (newPassword !== confirm) {
            setError('Passwords do not match.');
            return;
        }
        setBusy(true);
        try {
            const { data } = await api.post('accounts/password-reset/verify/', {
                email: email.trim().toLowerCase(),
                otp: otp.trim(),
                new_password: newPassword,
            });
            setMessage(data.detail || 'Password updated.');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Reset failed.');
        }
        setBusy(false);
    };

    return (
        <div className="fp-page">
            <div className="fp-inner">
                <img src={dgHeartLogo} alt="Dilgorithm" className="fp-logo" />
                <h1 className="fp-title">Reset password</h1>
                <p className="fp-lead">
                    Enter the email on your account. If it exists, we will send a 6-digit code. Use the code plus a new
                    password below.
                </p>

                <form className="fp-form" onSubmit={requestCode}>
                    <label className="fp-label">Email</label>
                    <input
                        className="fp-input"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                    <button type="submit" className="fp-btn fp-btn--secondary" disabled={busy}>
                        {busy ? 'Sending…' : 'Send reset code'}
                    </button>
                </form>

                <form className="fp-form fp-form--border" onSubmit={resetPassword}>
                    <label className="fp-label">Code from email</label>
                    <input
                        className="fp-input"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    />
                    <label className="fp-label">New password</label>
                    <input
                        className="fp-input"
                        type="password"
                        minLength={8}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <label className="fp-label">Confirm new password</label>
                    <input
                        className="fp-input"
                        type="password"
                        minLength={8}
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        autoComplete="new-password"
                    />
                    <button type="submit" className="fp-btn fp-btn--primary" disabled={busy}>
                        {busy ? 'Saving…' : 'Set new password'}
                    </button>
                </form>

                {message ? <p className="fp-msg fp-msg--ok">{message}</p> : null}
                {error ? <p className="fp-msg fp-msg--err">{error}</p> : null}

                <p className="fp-footer">
                    <Link to="/login">Back to login</Link>
                </p>
            </div>
        </div>
    );
};
