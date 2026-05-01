import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const Feed = () => {
    const { logout } = useContext(AuthContext);
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const response = await api.get('accounts/feed/');
                setMatches(response.data);
                setLoading(false);
            } catch (error) {
                console.error("Failed to load feed:", error);
                setLoading(false);
            }
        };
        fetchMatches();
    }, []);

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                <h2 style={{ color: '#d32f2f' }}>Dilgorithm Feed</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => navigate('/preferences')} style={{ padding: '8px 12px', cursor: 'pointer', borderRadius: '5px', border: '1px solid #ccc' }}>
                        ⚙️ AI Preferences
                    </button>
                    <button onClick={logout} style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>
                        Logout
                    </button>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '50px' }}>
                    <p>Scanning profiles for compatibility...</p>
                </div>
            ) : matches.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: '#666' }}>
                    <h3>No matches found yet!</h3>
                    <p>Try broadening your <strong>AI Preferences</strong> to see more people.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    {matches.map((match) => (
                        <div key={match.id} style={{ border: '1px solid #ddd', borderRadius: '12px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <h3 style={{ margin: '0' }}>{match.fullName || match.username}</h3>
                                <span style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                    {match.compatibility_score}% Match
                                </span>
                            </div>
                            <p style={{ color: '#555', fontSize: '0.9rem', margin: '15px 0' }}>{match.bio || "No bio available."}</p>
                            <button 
                                onClick={() => navigate(`/chat/room_${match.id}`)}
                                style={{ width: '100%', padding: '12px', cursor: 'pointer', backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>
                                Start Chat
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};