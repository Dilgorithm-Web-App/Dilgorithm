import { Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register, RegisterCredentials2FA } from './pages/AuthPages';
import { Feed } from './pages/Feed';
import { Preferences } from './pages/Preferences';
import { AuthContext } from './AuthContext';
import { useContext } from 'react';
import { Chat } from './pages/Chat';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { DashboardLayout } from './components/DashboardLayout';
import React, { useState, useEffect } from 'react';
import api from './api'; // <-- Changed to match your folder structure
import React, { useState } from 'react';
import logoHeart from './assets/logo-heart.jpg';
import logoText from './assets/logo-text.png';


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

const HomeIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const MessageIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
const SearchIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const StatsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const SettingsIcon = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;


// 4. THE VIEWS (SRP - Single Responsibility)

const AccountView = () => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Account Status</h3>
    <div style={lineDetail}>Status: <span style={maroonBold}>Identity Confirmed</span></div>
    <div style={lineDetail}>Membership Tier: <span style={grayBold}>{formatMembership('Premium Nikkah')}</span></div>
    <h3 style={{...sectionTitle, marginTop: '40px'}}>Edit Profile</h3>
    <div style={avatarSection}><div style={avatarCircle}>A</div><button style={uploadPill}>Upload</button></div>
    <h3 style={{...sectionTitle, marginTop: '30px', fontSize: '16px'}}>About Me:</h3>
    <input style={linearInput} placeholder="Height:" /><input style={linearInput} placeholder="Weight:" />
    <input style={linearInput} placeholder="Email:" /><input style={linearInput} placeholder="Edit Interests:" />
  </div>
);

const EngagementView = () => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Your Activity</h3>
    <div style={cleanRow}><span>Sent Requests</span><span>❯</span></div>
    <div style={cleanRow}><span>Received Requests</span><span>❯</span></div>
    <div style={cleanRow}><span>Match History</span><span>❯</span></div>
    <h3 style={{...sectionTitle, marginTop: '40px'}}>Blocked Accounts</h3>
    <p style={labelLight}>Blocked Accounts: 0</p>
    <button style={secondaryPill}>Manage Blocked List</button>
  </div>
);

const ConfigView = () => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Language & Translations</h3>
    <div style={cleanRow}><span>English</span><input type="radio" name="lang" defaultChecked /></div>
    <h3 style={{...sectionTitle, marginTop: '40px'}}>Permissions</h3>
    <div style={cleanRow}><span>Location</span><span>ON</span></div>
    <div style={cleanRow}><span>Notifications</span><span>ON</span></div>
    <div style={cleanRow}><span>Camera</span><span>ON</span></div>
    <button style={secondaryPill}>Refresh Permissions</button>
  </div>
);

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
            <Route path="/register/credentials" element={<RegisterCredentials2FA />} />

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
const SupportView = ({ onShowAbout }) => (
  <div style={cardStyle}>
    <h3 style={sectionTitle}>Help & Support</h3>
    <div style={chatBoxMock}>Chat with our AI support...</div>
    <input style={chatInputLine} placeholder="Type your message" />
    <h3 style={{...sectionTitle, marginTop: '40px'}}>Resources</h3>
    <div style={cleanRow} onClick={onShowAbout}><span>About Us</span><span>❯</span></div>
    <div style={cleanRow}><span>FAQ / Privacy Policy</span><span>❯</span></div>
    <p style={versionInfo}>v1.0.2</p>
  </div>
);

const AboutView = ({ onBack }) => (
  <div style={cardStyle}>
    <button onClick={onBack} style={backBtn}>❮ Back to Support</button>
    <h2 style={{...sectionTitle, textAlign:'center', fontSize: '24px'}}>ABOUT US</h2>
    <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
      <div style={aboutCard}><h4 style={aboutHeader}>MISSION</h4><p style={aboutSubtext}>Dilgorithm provides the pulse; the final heartbeat is always yours.</p></div>
      <div style={aboutCard}><h4 style={aboutHeader}>GOAL</h4><p style={aboutSubtext}>Give total clarity and final control.</p></div>
    </div>
    <div style={aboutCard}>
      <h4 style={aboutHeader}>SERVICES</h4>
      <p style={aboutSubtext}>+ Precision without Complexity<br/>+ Built for Your Vision<br/>+ Confidence at Scale</p>
    </div>
  </div>
);

const LogoutView = ({ onCancel }) => (
  <div style={logoutCentered}>
    <h2 style={{color: '#8B0000', fontSize: '32px', marginBottom: '10px', fontWeight: 'bold'}}>Logout</h2>
    <p style={{marginBottom: '40px', color: '#666', fontSize: '18px'}}>Are you sure you want to logout?</p>
    <div style={{display: 'flex', gap: '20px', justifyContent: 'center', alignItems: 'center'}}>
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
    case 'Engagement & Moderation': return <EngagementView />;
    case 'App Configuration': return <ConfigView />;
    case 'Support & Legal': return <SupportView onShowAbout={() => setShowAbout(true)} />;
    case 'Logout': return <LogoutView onCancel={() => setActiveTab('Account & Profile')} />;
    default: return <AccountView />;
  }
};


// 6. MAIN APP (Composite & Observer)

export default function App() {
  const [activeTab, setActiveTab] = useState('Account & Profile');
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div style={appWrapper}>
      {/* HEADER COMPOSITE */}
      <header style={headerFixed}>
        <div style={headerLeft}><img src={logoHeart} style={{height:'42px'}} /> <span style={settingsText}>Settings</span></div>
        <div style={headerCenter}>
          <img src={logoText} style={{height:'32px'}} />
          <p style={tagline}>THE PERFECT SYNTAX FOR YOUR SOULMATE</p>
        </div>
        <div style={headerRight}><div style={avatarHeader}>A</div></div>
      </header>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ICON NAV */}
        <nav style={sidebarIcons}>
          <div style={sideIcon}><HomeIcon /></div><div style={sideIcon}><MessageIcon /></div>
          <div style={sideIcon}><SearchIcon /></div><div style={sideIcon}><StatsIcon /></div>
          <div style={{...sideIcon, backgroundColor: '#FFF5F5', borderRadius: '12px', color: '#8B0000'}}><SettingsIcon /></div>
        </nav>

        {/* TEXT NAV (Iterator) */}
        <aside style={sidebarMenu}>
          {NAV_TABS.map(tab => (
            <button key={tab.id} onClick={() => {setActiveTab(tab.id); setShowAbout(false);}}
              style={{...menuPill, backgroundColor: activeTab === tab.id ? '#FFF5F5' : 'transparent', color: activeTab === tab ? '#8B0000' : '#666', fontWeight: activeTab === tab ? '600' : '400'}}>
              {tab.label}
            </button>
          ))}
        </aside>

        {/* MAIN STAGE (Template/Factory) */}
        <main style={mainContent}>
          <ViewFactory 
            activeTab={activeTab} 
            showAbout={showAbout} 
            setShowAbout={setShowAbout} 
            setActiveTab={setActiveTab} 
          />
        </main>
      </div>
    </div>
  )
}


// STYLES 

const appWrapper = { display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#fff', fontFamily: 'Inter, sans-serif' };
const headerFixed = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 40px', height: '80px', borderBottom: '1px solid #f2f2f2' };
const headerLeft = { display: 'flex', alignItems: 'center', width: '280px' };
const settingsText = { marginLeft: '12px', fontSize: '18px', fontWeight: '500', color: '#444' };
const headerCenter = { textAlign: 'center', flex: 1 };
const tagline = { fontSize: '9px', color: '#8B0000', fontWeight: 'bold', letterSpacing: '1px', marginTop: '4px' };
const headerRight = { width: '280px', display: 'flex', justifyContent: 'flex-end' };
const avatarHeader = { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#8B0000', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' };
const sidebarIcons = { width: '80px', borderRight: '1px solid #f2f2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '25px', gap: '30px' };
const sideIcon = { color: '#888', cursor: 'pointer', padding: '10px' };
const sidebarMenu = { width: '280px', borderRight: '1px solid #f2f2f2', padding: '30px 20px' };
const menuPill = { width: '100%', padding: '15px 22px', textAlign: 'left', border: 'none', borderRadius: '30px', marginBottom: '8px', cursor: 'pointer', fontSize: '14px' };
const mainContent = { flex: 1, backgroundColor: '#FAFAFA', padding: '50px', overflowY: 'auto' };
const cardStyle = { maxWidth: '720px', margin: '0 auto', backgroundColor: '#fff', padding: '50px', borderRadius: '40px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' };
const sectionTitle = { color: '#8B0000', fontSize: '20px', fontWeight: '700', marginBottom: '15px' };
const lineDetail = { fontSize: '14px', marginBottom: '10px', color: '#555' };
const maroonBold = { color: '#8B0000', fontWeight: 'bold', marginLeft: '10px' };
const grayBold = { color: '#999', marginLeft: '10px' };
const avatarSection = { display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '35px' };
const avatarCircle = { width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '26px' };
const uploadPill = { padding: '8px 22px', borderRadius: '25px', border: '1px solid #ddd', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px' };
const linearInput = { width: '100%', border: 'none', borderBottom: '1px solid #eee', padding: '15px 0', marginBottom: '15px', outline: 'none', fontSize: '15px' };
const cleanRow = { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f9f9f9', cursor: 'pointer', fontSize: '14px', color: '#444' };
const secondaryPill = { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#f4f4f4', cursor: 'pointer', marginTop: '15px', fontSize: '13px' };
const chatBoxMock = { padding: '15px 25px', backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '30px', color: '#ccc', marginBottom: '15px', fontSize: '14px' };
const chatInputLine = { width: '100%', padding: '15px 25px', borderRadius: '30px', border: 'none', backgroundColor: '#f0f0f0', outline: 'none', fontSize: '13px' };
const versionInfo = { textAlign: 'center', color: '#ddd', fontSize: '11px', marginTop: '50px' };
const aboutCard = { flex: 1, padding: '25px', border: '1px solid #eee', borderRadius: '25px', textAlign: 'center' };
const aboutHeader = { color: '#8B0000', fontSize: '16px', marginBottom: '10px' };
const aboutSubtext = { fontSize: '12px', color: '#666', lineHeight: '1.5' };
const backBtn = { border: 'none', background: 'none', color: '#8B0000', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px' };
const labelLight = { fontSize: '14px', color: '#777' };
const logoutCentered = { textAlign: 'center', padding: '80px 0' };
const maroonMainBtn = { width: '180px', padding: '14px 0', borderRadius: '30px', border: 'none', backgroundColor: '#8B0000', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const whiteCancelBtn = { width: '180px', padding: '14px 0', borderRadius: '30px', border: '1px solid #eee', backgroundColor: '#fff', fontWeight: 'bold', cursor: 'pointer' };