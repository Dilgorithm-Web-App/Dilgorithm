import { useState, useContext, useRef } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import ReCAPTCHA from 'react-google-recaptcha';

export const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [captchaToken, setCaptchaToken] = useState(null);
    const [statusMessage, setStatusMessage] = useState('');
    const { login, loginWithGoogle } = useContext(AuthContext);
    const recaptchaRef = useRef(null);

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!captchaToken) {
            setStatusMessage('Please complete CAPTCHA before signing in.');
            return;
        }

        const success = await login(email, password, captchaToken);
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        if (!captchaToken) {
            setStatusMessage('Complete CAPTCHA before using Google sign-in.');
            return;
        }

        setStatusMessage('');
        const success = await loginWithGoogle(credentialResponse, captchaToken);
        if (!success) {
            recaptchaRef.current?.reset();
            setCaptchaToken(null);
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center', maxWidth: '560px', margin: '0 auto' }}>
            <h2>Login to Dilgorithm</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder="Email"
                    onChange={e => setEmail(e.target.value)}
                    required
                    style={{ width: '100%', maxWidth: '360px', padding: '10px' }}
                />
                <br />
                <br />
                <input
                    type="password"
                    placeholder="Password"
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', maxWidth: '360px', padding: '10px' }}
                />
                <br />
                <br />

                <p style={{ marginBottom: '10px', fontWeight: 600, letterSpacing: '0.4px' }}>
                    REGISTER ACCOUNT
                </p>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '14px',
                        flexWrap: 'wrap',
                        marginBottom: '18px',
                    }}
                >
                    {googleClientId ? (
                        <div
                            style={{
                                border: '1px solid #d1d5db',
                                borderRadius: '999px',
                                padding: '2px 10px',
                                backgroundColor: '#fff',
                            }}
                        >
                            <GoogleLogin
                                onSuccess={handleGoogleSuccess}
                                onError={() => setStatusMessage('Google sign-in failed. Please try again.')}
                                text="signin_with"
                                shape="pill"
                                theme="outline"
                                size="medium"
                            />
                        </div>
                    ) : (
                        <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                            Set VITE_GOOGLE_CLIENT_ID in frontend/.env
                        </div>
                    )}

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
                        <div style={{ fontSize: '13px', color: '#b91c1c' }}>
                            Set VITE_RECAPTCHA_SITE_KEY in frontend/.env
                        </div>
                    )}
                </div>

                {statusMessage && (
                    <p style={{ color: '#b91c1c', marginTop: '0', marginBottom: '12px', fontSize: '14px' }}>
                        {statusMessage}
                    </p>
                )}

                <button type="submit">Log In</button>
            </form>
            <p>Need an account? <a href="/register">Register here</a>.</p>
        </div>
    );
};

export const Register = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('accounts/register/', { email, username, password });
            alert('Registration Successful! Please log in.');
            navigate('/login');
        } catch (error) {
            // This prints the exact error from Django into your browser console
            console.error("Django says:", error.response?.data);

            // This pops up the real error on your screen
            alert("Real Error: " + JSON.stringify(error.response?.data || error.message));
        }
    };

    return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
            <h2>Register for Dilgorithm</h2>
            <form onSubmit={handleSubmit}>
                <input type="email" placeholder="Email" onChange={e => setEmail(e.target.value)} required /><br /><br />
                <input type="text" placeholder="Username" onChange={e => setUsername(e.target.value)} required /><br /><br />
                <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} required /><br /><br />
                <button type="submit">Register</button>
            </form>
            <p>Already have an account? <a href="/login">Log in here</a>.</p>
        </div>
    );
};