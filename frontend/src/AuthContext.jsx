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

    const login = async (email, password) => {
        try {
            const response = await api.post('accounts/login/', { email, password });
            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            setUser({ token: response.data.access });
            navigate('/home');
        } catch (error) {
            alert('Login failed. Check your credentials.');
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        navigate('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};