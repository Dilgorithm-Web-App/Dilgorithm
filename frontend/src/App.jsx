import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './pages/AuthPages';
import { Feed } from './pages/Feed';
import { Preferences } from './pages/Preferences';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';
import { Chat } from './pages/Chat';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './components/DashboardLayout';

const RequireAuth = ({ children }) => {
    const { user } = useContext(AuthContext);
    return user ? children : <Navigate to="/login" />;
};

const DashboardRoute = ({ children }) => (
    <RequireAuth>
        <DashboardLayout>{children}</DashboardLayout>
    </RequireAuth>
);

function App() {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes with Dashboard Layout */}
            <Route path="/home" element={<DashboardRoute><HomePage /></DashboardRoute>} />
            <Route path="/feed" element={<DashboardRoute><Feed /></DashboardRoute>} />
            <Route path="/search" element={<DashboardRoute><SearchPage /></DashboardRoute>} />
            <Route path="/settings" element={<DashboardRoute><SettingsPage /></DashboardRoute>} />
            <Route path="/preferences" element={<DashboardRoute><Preferences /></DashboardRoute>} />
            <Route path="/chat/:roomName" element={<DashboardRoute><Chat /></DashboardRoute>} />
        </Routes>
    );
}

export default App;