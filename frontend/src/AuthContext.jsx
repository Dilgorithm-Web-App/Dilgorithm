import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { registerSessionExpiredHandler } from './api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) setUser({ token });
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    }, [navigate]);

    useEffect(() => {
        registerSessionExpiredHandler(logout);
    }, [logout]);

    const login = async (email, password, captchaToken) => {
        try {
            const response = await api.post('accounts/login/', {
                email,
                password,
                captcha_token: captchaToken,
            });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUser({ token: response.data.access });
            navigate('/home');
            return true;
        } catch (error) {
            const detail =
                error.response?.data?.detail ||
                (typeof error.response?.data === 'string' ? error.response.data : null) ||
                error.message;
            alert(detail ? `Login failed: ${detail}` : 'Login failed. Check your credentials and CAPTCHA.');
            return false;
        }
    };

    const loginWithGoogle = async (credentialResponse, captchaToken) => {
        const credential = credentialResponse?.credential;
        if (!credential) {
            alert('Google sign-in did not return a valid credential.');
            return false;
        }
        try {
            const response = await api.post('accounts/google-login/', {
                credential,
                captcha_token: captchaToken,
            });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUser({
                token: response.data.access,
                email: response.data.email,
            });
            navigate('/home');
            return true;
        } catch (error) {
            alert(error.response?.data?.detail || 'Google sign-in failed.');
            return false;
        }
    };

    /** Used after email registration (2FA) so the next step can call authenticated APIs without a full page reload. */
    const setSession = (access, refresh, partial = {}) => {
        localStorage.setItem('access_token', access);
        if (refresh) {
            localStorage.setItem('refresh_token', refresh);
        }
        setUser({ token: access, ...partial });
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout, setSession }}>
            {children}
        </AuthContext.Provider>
    );
};