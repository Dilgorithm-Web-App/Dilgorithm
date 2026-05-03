import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';
import dgHeartLogo from '../assets/dg_heart_logo.png';
import dilgorithmLogoText from '../assets/dilgorithm-logo-text.png';
import './AuthPages.css';

/** Same UI font as login (Plus Jakarta Sans is loaded in index.html). */
const AUTH_UI_FONT = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const { login, loginWithGoogle } = useContext(AuthContext);
    const recaptchaRef = useRef(null);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const captchaRequired = Boolean(recaptchaSiteKey);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (captchaRequired && !captchaToken) {
            setStatusMessage('Please complete CAPTCHA before signing in.');
            return;
        }

        const success = await login(email, password, captchaToken || '');
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (captchaRequired && !captchaToken) {
            setStatusMessage('Complete CAPTCHA before using Google sign-in.');
            return;
        }

        setStatusMessage('');
        const success = await loginWithGoogle(credentialResponse, captchaToken || '');
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Page 1: Logo only */}
            <section className="auth-hero" aria-label="Logo">
                <img src={dgHeartLogo} alt="Dilgorithm logo" className="auth-hero-logo" />
            </section>

            {/* Page 2: Login */}
            <section className="auth-form-section" aria-label="Log in">
                <div className="auth-card">
                    <img
                        src={dilgorithmLogoText}
                        alt="Dilgorithm"
                        className="auth-brand-image"
                    />
                    <h2 className="auth-header">Log In</h2>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="auth-input"
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="auth-input"
                            onChange={e => setPassword(e.target.value)}
                            required
                        />

                        {/* Styled Links */}
                        <div className="link-group">
                            <p>Need an account? <Link to="/register">Register</Link></p>
                            <p>Forgot password? <Link to="/forgot-password">Reset</Link></p>
                            <p>
                                Staff / moderator?{' '}
                                <Link to="/login/admin">Log in to admin dashboard</Link>
                            </p>
                        </div>

                        {statusMessage && (
                            <p style={{ color: '#b91c1c', margin: '0', fontSize: '14px' }}>
                                {statusMessage}
                            </p>
                        )}

                        <button type="submit" className="qabool-hai-btn">Qabool Hai</button>
                    </form>

                    {/* Captcha Wrapper clips the red text */}
                    <div className="captcha-wrapper">
                        {recaptchaSiteKey ? (
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={recaptchaSiteKey}
                                onChange={(token) => {
                                    setCaptchaToken(token);
                                    if (token) setStatusMessage('');
                                }}
                                size="normal"
                            />
                        ) : (
                            <div style={{ fontSize: '13px', color: '#6b6375' }}>
                                No reCAPTCHA site key — CAPTCHA skipped in local dev (backend must run with
                                DEBUG and no RECAPTCHA_SECRET_KEY).
                            </div>
                        )}
                    </div>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <div className="google-container">
                        {googleClientId ? (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setStatusMessage('Google sign-in failed. Please try again.')}
                                text="signin_with"
                                shape="pill"
                                theme="outline"
                                size="medium"
                            />
                        ) : (
                            <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                                Set VITE_GOOGLE_CLIENT_ID in frontend/.env
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

/** Same credentials + CAPTCHA as member login; after success, requires is_staff and lands on /admin. */
export const AdminLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const { login, loginWithGoogle } = useContext(AuthContext);
    const recaptchaRef = useRef(null);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    const staffLoginOpts = { redirectTo: '/admin', staffOnly: true };
    const captchaRequired = Boolean(recaptchaSiteKey);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (captchaRequired && !captchaToken) {
            setStatusMessage('Please complete CAPTCHA before signing in.');
            return;
        }

        const success = await login(email, password, captchaToken || '', staffLoginOpts);
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (captchaRequired && !captchaToken) {
            setStatusMessage('Complete CAPTCHA before using Google sign-in.');
            return;
        }

        setStatusMessage('');
        const success = await loginWithGoogle(credentialResponse, captchaToken || '', staffLoginOpts);
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    return (
        <div className="auth-page-container">
            <section className="auth-hero" aria-label="Logo">
                <img src={dgHeartLogo} alt="Dilgorithm logo" className="auth-hero-logo" />
            </section>

            <section className="auth-form-section" aria-label="Staff log in">
                <div className="auth-card">
                    <img
                        src={dilgorithmLogoText}
                        alt="Dilgorithm"
                        className="auth-brand-image"
                    />
                    <h2 className="auth-header">Staff / moderator login</h2>
                    <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#6b6375' }}>
                        Use your staff account to open the moderation dashboard. Member accounts cannot
                        use this page.
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        <input
                            type="email"
                            placeholder="Email"
                            className="auth-input"
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="auth-input"
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <div className="link-group">
                            <p>
                                Not staff? <Link to="/login">Member login</Link>
                            </p>
                        </div>

                        {statusMessage && (
                            <p style={{ color: '#b91c1c', margin: '0', fontSize: '14px' }}>
                                {statusMessage}
                            </p>
                        )}

                        <button type="submit" className="qabool-hai-btn">
                            Open admin dashboard
                        </button>
                    </form>

                    <div className="captcha-wrapper">
                        {recaptchaSiteKey ? (
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={recaptchaSiteKey}
                                onChange={(token) => {
                                    setCaptchaToken(token);
                                    if (token) setStatusMessage('');
                                }}
                                size="normal"
                            />
                        ) : (
                            <div style={{ fontSize: '13px', color: '#6b6375' }}>
                                No reCAPTCHA site key — CAPTCHA skipped in local dev (backend must run with
                                DEBUG and no RECAPTCHA_SECRET_KEY).
                            </div>
                        )}
                    </div>

                    <div className="divider">
                        <span>OR</span>
                    </div>

                    <div className="google-container">
                        {googleClientId ? (
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setStatusMessage('Google sign-in failed. Please try again.')}
                                text="signin_with"
                                shape="pill"
                                theme="outline"
                                size="medium"
                            />
                        ) : (
                            <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                                Set VITE_GOOGLE_CLIENT_ID in frontend/.env
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export const Register = () => {
    const [name, setName] = useState('');
    const [gender, setGender] = useState('');
    const [dob, setDob] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [formError, setFormError] = useState('');
    const navigate = useNavigate();
    const registerPalette = {
        pageBg: 'transparent',
        panelBg: '#fffdfd',
        panelBorder: '#f1e6eb',
        label: '#4b4a55',
        inputBg: '#ffffff',
        buttonBg: '#b74247',
        progressTrack: '#ece6ea',
        progressDot: '#a81212',
    };

    const isValidName = (value) => /^[A-Za-z ]{2,50}$/.test(value.trim());

    const isValidDateString = (value) => {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const [yearText, monthText, dayText] = value.split('-');
        const year = Number(yearText);
        const month = Number(monthText);
        const day = Number(dayText);
        if (month < 1 || month > 12) return false;
        if (day < 1 || day > 31) return false;
        const parsed = new Date(year, month - 1, day);
        return (
            parsed.getFullYear() === year &&
            parsed.getMonth() === month - 1 &&
            parsed.getDate() === day
        );
    };

    const isAtLeast18 = (value) => {
        if (!isValidDateString(value)) return false;
        const [year, month, day] = value.split('-').map(Number);
        const dobDate = new Date(year, month - 1, day);
        const today = new Date();
        if (dobDate > today) return false;
        let age = today.getFullYear() - dobDate.getFullYear();
        const monthDelta = today.getMonth() - dobDate.getMonth();
        if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dobDate.getDate())) {
            age -= 1;
        }
        return age >= 18;
    };

    const isValidHeight = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return true;
        const match = /^([4-7])\.(\d{1,2})$/.exec(trimmed);
        if (!match) return false;
        const inches = Number(match[2]);
        return inches >= 0 && inches <= 11;
    };

    const isValidWeight = (value) => {
        const trimmed = value.trim();
        if (!trimmed) return true;
        if (!/^\d+(\.\d+)?$/.test(trimmed)) return false;
        const n = Number(trimmed);
        return n >= 30 && n <= 300;
    };

    const maxDob = (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 18);
        return d.toISOString().split('T')[0];
    })();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormError('');

        if (!isValidName(name)) {
            setFormError('Name must be 2-50 characters, using alphabets and spaces only.');
            return;
        }
        if (!['female', 'male', 'other'].includes(gender)) {
            setFormError('Please select a valid gender.');
            return;
        }
        if (!isValidDateString(dob)) {
            setFormError('DOB must be a valid date in YYYY-MM-DD format.');
            return;
        }
        if (!isAtLeast18(dob)) {
            setFormError('You must be at least 18 years old to register.');
            return;
        }
        if (!isValidHeight(height)) {
            setFormError('Height must be in feet format like 5.10 (4.00 to 7.11).');
            return;
        }
        if (!isValidWeight(weight)) {
            setFormError('Weight must be a numeric value between 30 and 300.');
            return;
        }

        navigate('/register/credentials', {
            state: {
                profile: {
                    name: name.trim(),
                    gender,
                    dob,
                    height: height.trim(),
                    weight: weight.trim(),
                },
            },
        });
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                width: '100%',
                backgroundColor: registerPalette.pageBg,
                padding: '26px 20px 48px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                fontFamily: AUTH_UI_FONT,
            }}
        >
            <div style={{ width: '100%', maxWidth: '920px', marginBottom: '10px', textAlign: 'left' }}>
                <button
                    type="button"
                    onClick={() => navigate('/login')}
                    style={{
                        border: '1px solid #d8cfd4',
                        borderRadius: '999px',
                        backgroundColor: '#fff',
                        color: '#4b4a55',
                        padding: '8px 14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    ← Back
                </button>
            </div>

            <div
                style={{
                    width: '100%',
                    maxWidth: '920px',
                    backgroundColor: registerPalette.panelBg,
                    border: `2px solid ${registerPalette.panelBorder}`,
                    borderRadius: '14px',
                    padding: '26px 30px 32px',
                    boxSizing: 'border-box',
                    boxShadow: '0 10px 28px rgba(76, 52, 18, 0.15)',
                }}
            >
                <div
                    style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '180px 1fr 180px',
                        alignItems: 'start',
                        marginBottom: '4px',
                    }}
                >
                    <img
                        src={dgHeartLogo}
                        alt="Dilgorithm logo"
                        style={{
                            width: '110px',
                            objectFit: 'contain',
                            mixBlendMode: 'normal',
                            justifySelf: 'start',
                        }}
                    />
                    <div style={{ marginTop: '-6px' }}>
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '480px',
                                margin: '0 auto 8px',
                                height: '20px',
                                borderRadius: '999px',
                                backgroundColor: registerPalette.progressTrack,
                                position: 'relative',
                            }}
                        >
                            <span
                                style={{
                                    position: 'absolute',
                                    left: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    backgroundColor: registerPalette.progressDot,
                                }}
                            />
                        </div>
                        <div
                            style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                fontSize: '34px',
                                lineHeight: 1.1,
                                color: registerPalette.label,
                                letterSpacing: '0.2px',
                            }}
                        >
                            Register
                        </div>
                    </div>
                    <div />
                </div>

                <form
                    onSubmit={handleSubmit}
                    style={{
                        display: 'grid',
                        gap: '14px',
                        width: '100%',
                        maxWidth: '620px',
                        margin: '0 auto',
                    }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '14px' }}>
                        <label style={{ textAlign: 'right', fontWeight: 700, color: registerPalette.label }}>Name:</label>
                        <input
                            type="text"
                            value={name}
                            placeholder="Enter full name"
                            onChange={e => setName(e.target.value)}
                            required
                            minLength={2}
                            maxLength={50}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '999px',
                                border: '1px solid #ece6ea',
                                backgroundColor: registerPalette.inputBg,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '14px' }}>
                        <label style={{ textAlign: 'right', fontWeight: 700, color: registerPalette.label }}>Gender:</label>
                        <select
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            required
                            style={{
                                padding: '12px 14px',
                                borderRadius: '999px',
                                border: '1px solid #ece6ea',
                                backgroundColor: registerPalette.inputBg,
                                boxSizing: 'border-box',
                            }}
                        >
                            <option value="">Select gender</option>
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '14px' }}>
                        <label style={{ textAlign: 'right', fontWeight: 700, color: registerPalette.label }}>Date of birth:</label>
                        <input
                            type="date"
                            value={dob}
                            onChange={e => setDob(e.target.value)}
                            required
                            max={maxDob}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '999px',
                                border: '1px solid #ece6ea',
                                backgroundColor: registerPalette.inputBg,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '14px' }}>
                        <label style={{ textAlign: 'right', fontWeight: 700, color: registerPalette.label }}>Height:</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={height}
                            placeholder="Optional (e.g., 5.10)"
                            onChange={e => setHeight(e.target.value)}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '999px',
                                border: '1px solid #ece6ea',
                                backgroundColor: registerPalette.inputBg,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', alignItems: 'center', gap: '14px' }}>
                        <label style={{ textAlign: 'right', fontWeight: 700, color: registerPalette.label }}>Weight:</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={weight}
                            placeholder="Optional (30-300)"
                            onChange={e => setWeight(e.target.value)}
                            style={{
                                padding: '12px 14px',
                                borderRadius: '999px',
                                border: '1px solid #ece6ea',
                                backgroundColor: registerPalette.inputBg,
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>
                    {formError ? (
                        <p style={{ margin: '0', color: '#7f1d1d', textAlign: 'center', fontWeight: 600 }}>
                            {formError}
                        </p>
                    ) : null}

                    <button
                        type="submit"
                        style={{
                            marginTop: '24px',
                            justifySelf: 'center',
                            border: 'none',
                            borderRadius: '999px',
                            padding: '12px 42px',
                            backgroundColor: registerPalette.buttonBg,
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Qabool hai
                    </button>
                </form>

                <p style={{ marginTop: '14px', textAlign: 'center' }}>
                    Already have an account? <a href="/login">Log in here</a>.
                </p>
            </div>
        </div>
    );
};

export const RegisterCredentials2FA = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { setSession } = useContext(AuthContext);
    const profile = location.state?.profile;

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const submitCredentials = async (e) => {
        e.preventDefault();
        if (!profile?.name) {
            navigate('/register');
            return;
        }
        if (password !== confirmPassword) {
            setStatusMessage('Passwords do not match.');
            return;
        }
        try {
            await api.post('accounts/register/init-2fa/', {
                email,
                password,
                username: profile.name,
                profile,
            });
            setOtpSent(true);
            setStatusMessage('OTP sent. Check your email and enter the 6-digit code.');
        } catch (error) {
            setStatusMessage(error.response?.data?.detail || 'Could not start 2FA registration.');
        }
    };

    const verifyOtp = async (e) => {
        e.preventDefault();
        const otpTrimmed = otp.trim();
        try {
            const { data } = await api.post('accounts/register/verify-2fa/', {
                email: email.trim().toLowerCase(),
                otp: otpTrimmed,
            });
            if (data.access) {
                setSession(data.access, data.refresh, { email: data.email });
                navigate('/register/photo', { replace: true });
            } else {
                navigate('/login');
            }
        } catch (error) {
            const d = error.response?.data;
            let msg = 'OTP verification failed.';
            if (d) {
                if (typeof d.detail === 'string') msg = d.detail;
                else if (Array.isArray(d.detail)) msg = d.detail.join(' ');
                else if (d.detail && typeof d.detail === 'object') msg = JSON.stringify(d.detail);
                else {
                    const key = Object.keys(d).find((k) => Array.isArray(d[k]));
                    if (key) msg = `${key}: ${d[key].join(' ')}`;
                }
            }
            setStatusMessage(msg);
        }
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'transparent',
                padding: '40px 20px',
                boxSizing: 'border-box',
                fontFamily: AUTH_UI_FONT,
            }}
        >
            <div style={{ maxWidth: '620px', margin: '0 auto', background: '#fffdfd', border: '1px solid #f1e6eb', borderRadius: '14px', padding: '24px' }}>
                <div style={{ marginBottom: '12px' }}>
                    <button
                        type="button"
                        onClick={() => navigate('/register', { state: { profile } })}
                        style={{
                            border: '1px solid #d8cfd4',
                            borderRadius: '999px',
                            backgroundColor: '#fff',
                            color: '#4b4a55',
                            padding: '8px 14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        ← Back
                    </button>
                </div>
                <h2 style={{ textAlign: 'center', marginTop: 0 }}>Register — step 2 (credentials + 2fa)</h2>

                {!otpSent ? (
                    <form onSubmit={submitCredentials} style={{ display: 'grid', gap: '12px' }}>
                        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ece6ea' }} />
                        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ece6ea' }} />
                        <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ece6ea' }} />
                        <button type="submit" style={{ border: 'none', borderRadius: '999px', padding: '12px 22px', background: '#b74247', color: '#fff', fontWeight: 700 }}>
                            Send OTP
                        </button>
                    </form>
                ) : (
                    <form onSubmit={verifyOtp} style={{ display: 'grid', gap: '12px' }}>
                        <input type="text" placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ padding: '12px', borderRadius: '10px', border: '1px solid #ece6ea' }} />
                        <button type="submit" style={{ border: 'none', borderRadius: '999px', padding: '12px 22px', background: '#b74247', color: '#fff', fontWeight: 700 }}>
                            Verify OTP & Create Account
                        </button>
                    </form>
                )}

                {statusMessage && <p style={{ marginTop: '12px', color: '#7f1d1d' }}>{statusMessage}</p>}
            </div>
        </div>
    );
};