import { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from './api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) setUser({ token });
    }, []);

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
            alert('Login failed. Check your credentials.');
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

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};