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
import React, { useState } from 'react';
import logoHeart from './assets/logo-heart.jpg';
import logoText from './assets/logo-text.png';
import EngagementView from './EngagementView'; // Adjust the path if you put it in a folder



// 1. SINGLETON / ITERATOR PATTERN (Config)
// This acts as our "Source of Truth". We iterate over this to build the nav.
const NAV_TABS = [
  { id: 'Account & Profile', label: 'Account & Profile' },
  { id: 'Engagement & Moderation', label: 'Engagement & Moderation' },
  { id: 'App Configuration', label: 'App Configuration' },
  { id: 'Support & Legal', label: 'Support & Legal' },
  { id: 'Logout', label: 'Logout' }
];


// 2. ADAPTER PATTERN (Formatting)

const formatMembership = (tier) => `Basic Member/${tier} Plan`;


// 3. ICONS (Kept exactly like before)

const HomeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>;
const MessageIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
const SearchIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>;
const StatsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
const SettingsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>;


// 4. THE VIEWS (SRP - Single Responsibility)

const AccountView = () => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Account Status</h3>
    <div style={lineDetail}>Status: <span style={maroonBold}>Identity Confirmed</span></div>
    <div style={lineDetail}>Membership Tier: <span style={grayBold}>{formatMembership('Premium Nikkah')}</span></div>
    <h3 style={{ ...sectionTitle, marginTop: '40px' }}>Edit Profile</h3>
    <div style={avatarSection}><div style={avatarCircle}>A</div><button style={uploadPill}>Upload</button></div>
    <h3 style={{ ...sectionTitle, marginTop: '30px', fontSize: '16px' }}>About Me:</h3>
    <input style={linearInput} placeholder="Height:" /><input style={linearInput} placeholder="Weight:" />
    <input style={linearInput} placeholder="Email:" /><input style={linearInput} placeholder="Edit Interests:" />
  </div>
);

const ConfigView = () => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Language & Translations</h3>
    <div style={cleanRow}><span>English</span><input type="radio" name="lang" defaultChecked /></div>
    <h3 style={{ ...sectionTitle, marginTop: '40px' }}>Permissions</h3>
    <div style={cleanRow}><span>Location</span><span>ON</span></div>
    <div style={cleanRow}><span>Notifications</span><span>ON</span></div>
    <div style={cleanRow}><span>Camera</span><span>ON</span></div>
    <button style={secondaryPill}>Refresh Permissions</button>
  </div>
);

const SupportView = ({ onShowAbout }) => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Help & Support</h3>
    <div style={chatBoxMock}>Chat with our AI support...</div>
    <input style={chatInputLine} placeholder="Type your message" />
    <h3 style={{ ...sectionTitle, marginTop: '40px' }}>Resources</h3>
    <div style={cleanRow} onClick={onShowAbout}><span>About Us</span><span>❯</span></div>
    <div style={cleanRow}><span>FAQ / Privacy Policy</span><span>❯</span></div>
    <p style={versionInfo}>v1.0.2</p>
  </div>
);

const AboutView = ({ onBack }) => (
  <div style={cardStyle}>
    <button onClick={onBack} style={backBtn}>❮ Back to Support</button>
    <h2 style={{ ...sectionTitle, textAlign: 'center', fontSize: '24px' }}>ABOUT US</h2>
    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
      <div style={aboutCard}><h4 style={aboutHeader}>MISSION</h4><p style={aboutSubtext}>Dilgorithm provides the pulse; the final heartbeat is always yours.</p></div>
      <div style={aboutCard}><h4 style={aboutHeader}>GOAL</h4><p style={aboutSubtext}>Give total clarity and final control.</p></div>
    </div>
    <div style={aboutCard}>
      <h4 style={aboutHeader}>SERVICES</h4>
      <p style={aboutSubtext}>+ Precision without Complexity<br />+ Built for Your Vision<br />+ Confidence at Scale</p>
    </div>
  </div>
);

const LogoutView = ({ onCancel }) => (
  <div style={logoutCentered}>
    <h2 style={{ color: '#8B0000', fontSize: '32px', marginBottom: '10px', fontWeight: 'bold' }}>Logout</h2>
    <p style={{ marginBottom: '40px', color: '#666', fontSize: '18px' }}>Are you sure you want to logout?</p>
    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center' }}>
      <button style={maroonMainBtn}>Yes, Logout</button>
      <button style={whiteCancelBtn} onClick={onCancel}>Cancel</button>
    </div>
  </div>
);


// 5. FACTORY PATTERN (Selection Logic)

const ViewFactory = ({ activeTab, showAbout, setShowAbout, setActiveTab }) => {
  if (showAbout) return <AboutView onBack={() => setShowAbout(false)} />;

  switch (activeTab) {
    case 'Account & Profile': return <AccountView />;

    // NOW IT USES THE IMPORTED COMPONENT
    case 'Engagement & Moderation': return <EngagementView />;

    case 'App Configuration': return <ConfigView />;
    case 'Support & Legal': return <SupportView onShowAbout={() => setShowAbout(true)} />;
    case 'Logout': return <LogoutView onCancel={() => setActiveTab('Account & Profile')} />;
    default: return <AccountView />;
  }
};

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
