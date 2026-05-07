import { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { registerSessionExpiredHandler } from './api';
import { formatApiError } from './utils/formatApiError';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    /** Google ID tokens are one-use; block duplicate submits (e.g. StrictMode / double taps). */
    const googleLoginInFlightRef = useRef(false);

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

    const login = async (email, password, options = {}) => {
        const { redirectTo = '/home', staffOnly = false } = options;
        try {
            const response = await api.post('accounts/login/', {
                email,
                password,
            });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUser({ token: response.data.access });

            if (staffOnly) {
                try {
                    const { data } = await api.get('accounts/profile/');
                    if (!data.is_staff) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        setUser(null);
                        alert(
                            'This portal is for staff only. Your account does not have moderator access.',
                        );
                        return false;
                    }
                } catch (verifyErr) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    const d = verifyErr.response?.data?.detail;
                    const msg =
                        typeof d === 'string'
                            ? d
                            : Array.isArray(d)
                              ? d[0]
                              : verifyErr.message;
                    alert(
                        msg
                            ? `Could not verify staff access: ${msg}`
                            : 'Could not verify staff access. Is the API running (and is your user marked staff in Django)?',
                    );
                    return false;
                }
            }

            navigate(redirectTo);
            return true;
        } catch (error) {
            alert(formatApiError(error, 'Login failed. Check your credentials.'));
            return false;
        }
    };

    const loginWithGoogle = useCallback(async (credentialResponse, options = {}) => {
        const { redirectTo = '/home', staffOnly = false } = options;
        if (googleLoginInFlightRef.current) {
            return false;
        }
        const credential = credentialResponse?.credential;
        if (!credential) {
            alert('Google sign-in did not return a valid credential.');
            return false;
        }
        googleLoginInFlightRef.current = true;
        try {
            const response = await api.post('accounts/google-login/', {
                credential,
            });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUser({
                token: response.data.access,
                email: response.data.email,
            });

            if (staffOnly) {
                try {
                    const { data } = await api.get('accounts/profile/');
                    if (!data.is_staff) {
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refresh_token');
                        setUser(null);
                        alert(
                            'This portal is for staff only. Your account does not have moderator access.',
                        );
                        return false;
                    }
                } catch (verifyErr) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    alert(
                        formatApiError(
                            verifyErr,
                            'Could not verify staff access. Is the API running (and is your user marked staff in Django)?',
                        ),
                    );
                    return false;
                }
            }

            navigate(redirectTo);
            return true;
        } catch (error) {
            alert(formatApiError(error, 'Google sign-in failed.'));
            return false;
        } finally {
            googleLoginInFlightRef.current = false;
        }
    }, [navigate]);

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