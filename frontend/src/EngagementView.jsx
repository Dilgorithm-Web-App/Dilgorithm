import React, { useState } from 'react';

// ==========================================
// 1. DATA MODEL (Mock Data)
// ==========================================
const MOCK_DATA = {
  sent: [
    { id: 1, name: "Zainab R.", status: "Pending", date: "2 Hours ago" },
    { id: 2, name: "Sara K.", status: "Declined", date: "Yesterday" }
  ],
  received: [
    { id: 3, name: "Ahmed F.", status: "New", date: "5 Mins ago" },
    { id: 4, name: "Bilal S.", status: "Pending", date: "1 Hour ago" }
  ],
  matches: [
    { id: 5, name: "Fatima A.", status: "Matched", date: "May 1st" }
  ]
};

// ==========================================
// 2. HELPER LOGIC (Adapter Pattern)
// ==========================================
const getStatusStyle = (status) => {
  switch (status) {
    case 'Matched': return { color: '#8B0000', fontWeight: 'bold' };
    case 'Pending': return { color: '#f39c12' };
    case 'Declined': return { color: '#999' };
    case 'New': return { color: '#27ae60', fontWeight: 'bold' };
    default: return { color: '#666' };
  }
};

// ==========================================
// 3. MAIN COMPONENT
// ==========================================
const EngagementView = () => {
  // This state determines what we show: 'summary', 'sent', 'received', or 'matches'
  const [view, setView] = useState('summary');

  // --- THE RENDER LIST FUNCTION ---
  // This handles the "Detailed" views (Sent/Received/Matches)
  const renderDetailedList = (type) => (
    <div style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      <button onClick={() => setView('summary')} style={backBtnSmall}>❮ Back to Activity</button>
      <h4 style={{ color: '#8B0000', marginBottom: '25px', fontSize: '18px', fontWeight: '700' }}>
        {type === 'received' ? 'Incoming Requests' : type.toUpperCase()}
      </h4>
      
      {MOCK_DATA[type].map(item => (
        <div key={item.id} style={{...cleanRow, alignItems: 'center', padding: '18px 0'}}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600', fontSize: '15px', color: '#333' }}>{item.name}</div>
            <div style={{ fontSize: '11px', color: '#bbb', marginTop: '4px' }}>{item.date}</div>
          </div>
          
          {/* If it's a NEW received request, show buttons. Otherwise, show status label. */}
          {type === 'received' && item.status === 'New' ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={acceptBtn} onClick={() => alert(`Accepted ${item.name}`)}>Accept</button>
              <button style={declineBtn} onClick={() => alert(`Declined ${item.name}`)}>✕</button>
            </div>
          ) : (
            <span style={getStatusStyle(item.status)}>{item.status}</span>
          )}
        </div>
      ))}
    </div>
  );

  // --- THE SUMMARY VIEW ---
  // This is the default screen with the three main rows
  if (view === 'summary') {
    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Your Activity</h3>
        <p style={labelLight}>Manage your soulmate connections and history.</p>
        
        <div style={listRow} onClick={() => setView('sent')}>
          <span>Sent Requests</span>
          <span style={badgeCount}>{MOCK_DATA.sent.length} ❯</span>
        </div>
        
        <div style={listRow} onClick={() => setView('received')}>
          <span>Received Requests</span>
          <span style={{...badgeCount, backgroundColor: '#8B0000', color: '#fff'}}>
            {MOCK_DATA.received.length} New ❯
          </span>
        </div>

        <div style={listRow} onClick={() => setView('matches')}>
          <span>Match History</span>
          <span style={badgeCount}>{MOCK_DATA.matches.length} ❯</span>
        </div>

        <h3 style={{...sectionTitle, marginTop: '40px'}}>Moderation</h3>
        <div style={cleanRow}>
          <span>Blocked Accounts</span>
          <span style={{ color: '#999' }}>0 Accounts</span>
        </div>
        <button style={secondaryPill}>Manage Blocked List</button>
      </div>
    );
  }

  // --- FINAL RETURN ---
  // If state is NOT summary, show the detailed list inside the card
  return <div style={cardStyle}>{renderDetailedList(view)}</div>;
};

// ==========================================
// 4. STYLES (Keep these exactly as defined)
// ==========================================
const cardStyle = { maxWidth: '720px', margin: '0 auto', backgroundColor: '#fff', padding: '50px', borderRadius: '40px', boxShadow: '0 4px 25px rgba(0,0,0,0.02)' };
const sectionTitle = { color: '#8B0000', fontSize: '20px', fontWeight: '700', marginBottom: '15px' };
const labelLight = { fontSize: '14px', color: '#777', marginBottom: '30px' };
const listRow = { display: 'flex', justifyContent: 'space-between', padding: '22px 0', borderBottom: '1px solid #f9f9f9', cursor: 'pointer', fontSize: '15px', fontWeight: '500', color: '#444' };
const cleanRow = { display: 'flex', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid #f9f9f9', fontSize: '14px' };
const badgeCount = { fontSize: '12px', padding: '4px 12px', borderRadius: '15px', backgroundColor: '#f4f4f4', color: '#666' };
const secondaryPill = { padding: '10px 20px', borderRadius: '20px', border: 'none', backgroundColor: '#f4f4f4', cursor: 'pointer', marginTop: '15px', fontSize: '13px' };
const backBtnSmall = { border: 'none', background: 'none', color: '#8B0000', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '15px', padding: '0' };
const acceptBtn = { backgroundColor: '#8B0000', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer', fontWeight: 'bold' };
const declineBtn = { backgroundColor: '#f4f4f4', color: '#666', border: 'none', padding: '8px 12px', borderRadius: '50%', fontSize: '12px', cursor: 'pointer' };

export default EngagementView;