import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './pages/AuthPages';
import { Feed } from './pages/Feed';
import { Preferences } from './pages/Preferences';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';
import { Chat } from './pages/Chat';
import React, { useState, useEffect } from 'react';
import api from './api'; // <-- Changed to match your folder structure

const RequireAuth = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/feed" element={<RequireAuth><Feed /></RequireAuth>} />
            <Route path="/preferences" element={<RequireAuth><Preferences /></RequireAuth>} />
            <Route path="/chat/:roomName" element={<RequireAuth><Chat /></RequireAuth>} />
            {/* <Route path="/chat/:roomName" element={<RequireAuth><Chat /></RequireAuth>} /> */}
        </Routes>
    );
}

export default App;