import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register, RegisterCredentials2FA } from './pages/AuthPages';
import { RegisterPhotoPage } from './pages/RegisterPhotoPage';
import { Feed } from './pages/Feed';
import { Preferences } from './pages/Preferences';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';
import { Chat } from './pages/Chat';
import { ChatListPage } from './pages/ChatListPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutUsPage } from './pages/AboutUsPage';
import { AppConfigurationPage } from './pages/AppConfigurationPage';
import { EngagementModerationPage } from './pages/EngagementModerationPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OnboardingPage } from './pages/OnboardingPage';

const RequireAuth = ({ children }) => {
    const { user } = useContext(AuthContext);
    const hasToken = Boolean(localStorage.getItem('access_token'));
    return (user || hasToken) ? children : <Navigate to="/login" />;
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
            <Route path="/register/credentials" element={<RegisterCredentials2FA />} />
            <Route path="/register/photo" element={<RegisterPhotoPage />} />

            {/* Protected Routes with Dashboard Layout */}
            <Route path="/home" element={<DashboardRoute><HomePage /></DashboardRoute>} />
            <Route path="/feed" element={<DashboardRoute><Feed /></DashboardRoute>} />
            <Route path="/search" element={<DashboardRoute><SearchPage /></DashboardRoute>} />
            <Route path="/settings" element={<DashboardRoute><SettingsPage /></DashboardRoute>} />
            <Route path="/preferences" element={<DashboardRoute><Preferences /></DashboardRoute>} />
            <Route path="/engagement-moderation" element={<DashboardRoute><EngagementModerationPage /></DashboardRoute>} />
            <Route path="/app-configuration" element={<DashboardRoute><AppConfigurationPage /></DashboardRoute>} />
            <Route path="/about-us" element={<DashboardRoute><AboutUsPage /></DashboardRoute>} />
            <Route path="/chat-list" element={<DashboardRoute><ChatListPage /></DashboardRoute>} />
            <Route path="/chat/:roomName" element={<DashboardRoute><Chat /></DashboardRoute>} />
            <Route path="/onboarding" element={<OnboardingPage />} />
        </Routes>
    );
}

export default App;
