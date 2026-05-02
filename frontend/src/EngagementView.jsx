import React, { useState } from 'react';

// ==========================================
// 1. MOCK DATA (The "Model")
// ==========================================
const MOCK_ENGAGEMENTS = {
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
// 2. STATUS ADAPTER (Logic)
// ==========================================
// This follows the Adapter pattern to give us the right colors/labels
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
// 3. ENGAGEMENT VIEW (State & Strategy Patterns)
// ==========================================
const EngagementView = () => {
  // State Pattern: Tracks which sub-list we are viewing
  const [view, setView] = useState('summary'); // 'summary', 'sent', 'received', 'matches'

  // Iterator Pattern: Renders a list item based on the data
  const renderList = (type) => (
    <div style={{ animation: 'fadeIn 0.3s' }}>
      <button onClick={() => setView('summary')} style={backBtnSmall}>❮ Back</button>
      <h4 style={{ color: '#8B0000', marginBottom: '20px' }}>{type.toUpperCase()}</h4>
      {MOCK_ENGAGEMENTS[type].map(item => (
        <div key={item.id} style={cleanRow}>
          <div>
            <div style={{ fontWeight: '600' }}>{item.name}</div>
            <div style={{ fontSize: '11px', color: '#bbb' }}>{item.date}</div>
          </div>
          <span style={getStatusStyle(item.status)}>{item.status}</span>
        </div>
      ))}
    </div>
  );

  // The "Summary" view (What the user sees first)
  if (view === 'summary') {
    return (
      <div style={cardStyle}>
        <h3 style={sectionTitle}>Your Activity</h3>
        <p style={labelLight}>Manage your soulmate connections and history.</p>
        
        <div style={listRow} onClick={() => setView('sent')}>
          <span>Sent Requests</span>
          <span style={badgeCount}>{MOCK_ENGAGEMENTS.sent.length} ❯</span>
        </div>
        
        <div style={listRow} onClick={() => setView('received')}>
          <span>Received Requests</span>
          <span style={{...badgeCount, backgroundColor: '#8B0000', color: '#fff'}}>
            {MOCK_ENGAGEMENTS.received.length} New ❯
          </span>
        </div>

        <div style={listRow} onClick={() => setView('matches')}>
          <span>Match History</span>
          <span style={badgeCount}>{MOCK_ENGAGEMENTS.matches.length} ❯</span>
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

  // Render the specific list based on state
  return <div style={cardStyle}>{renderList(view)}</div>;
};

// ==========================================
// EXTRA STYLES FOR ENGAGEMENT
// ==========================================
const badgeCount = { 
  fontSize: '12px', 
  padding: '2px 10px', 
  borderRadius: '10px', 
  backgroundColor: '#f4f4f4', 
  color: '#666' 
};

const backBtnSmall = { 
  border: 'none', 
  background: 'none', 
  color: '#8B0000', 
  fontSize: '12px', 
  fontWeight: 'bold', 
  cursor: 'pointer', 
  marginBottom: '10px' 
};

export default EngagementView;