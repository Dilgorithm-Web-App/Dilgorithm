import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import dgLogo from '../assets/dg_heart_logo.png';
import brandLogo from '../assets/dilgorithm_logo.png';
import './DashboardLayout.css';

const PAGE_META = {
    '/home': 'Home',
    '/feed': 'AI Ranking',
    '/search': 'For You Page',
    '/settings': 'Settings',
    '/preferences': 'Settings',
    '/about-us': 'About Us',
};

export const DashboardLayout = ({ children }) => {
    const { logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const path = location.pathname;
    const isChat = path.startsWith('/chat');
    const pageLabel = isChat ? 'Chats' : (PAGE_META[path] || 'Home');

    const navItems = [
        { id: 'home', path: '/home', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
        { id: 'chat', path: '/chat-list', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> },
        { id: 'search', path: '/search', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> },
        { id: 'feed', path: '/feed', icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> },
    ];

    const isActive = (item) => {
        if (item.id === 'chat') return isChat;
        return path === item.path;
    };

    return (
        <div className="dl-layout">
            <aside className="dl-sidebar">
                {navItems.map(item => (
                    <button key={item.id} className={`dl-sidebar-btn ${isActive(item) ? 'dl-sidebar-btn--active' : ''}`} onClick={() => navigate(item.path)} title={item.id}>
                        {item.icon}
                    </button>
                ))}
                <div className="dl-sidebar-spacer" />
                <button className={`dl-sidebar-btn ${path === '/settings' || path === '/preferences' ? 'dl-sidebar-btn--active' : ''}`} onClick={() => navigate('/settings')} title="Settings">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </button>
            </aside>

            <div className="dl-main">
                <header className="dl-header">
                    <div className="dl-header-left">
                        <img src={dgLogo} alt="DG" className="dl-header-dg" />
                        <span className="dl-header-label">{pageLabel}</span>
                    </div>
                    <div className="dl-header-center">
                        <img src={brandLogo} alt="Dilgorithm" className="dl-header-brand" />
                    </div>
                    <div className="dl-header-right">
                        <div className="dl-header-avatar" onClick={() => navigate('/settings')}>U</div>
                    </div>
                </header>
                <main className="dl-content">{children}</main>
            </div>
        </div>
    );
};
