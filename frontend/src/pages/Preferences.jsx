import { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export const Preferences = () => {
    const [interests, setInterests] = useState('');
    const [sect, setSect] = useState('');
    const [location, setLocation] = useState('');
    const navigate = useNavigate();

    // Load existing preferences when the page opens
    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const response = await api.get('accounts/preferences/');
                const data = response.data;
                // Convert the array back to a comma-separated string for the text box
                setInterests(data.interestList.join(', '));
                setSect(data.partnerCriteria.sect || '');
                setLocation(data.partnerCriteria.location || '');
            } catch (error) {
                console.error("Failed to load preferences:", error);
            }
        };
        fetchPreferences();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Convert comma-separated string into an array (e.g. "Coding, Hiking" -> ["Coding", "Hiking"])
        const interestArray = interests.split(',').map(item => item.trim()).filter(item => item !== '');

        const payload = {
            interestList: interestArray,
            partnerCriteria: {
                sect: sect,
                location: location
            }
        };

        try {
            await api.put('accounts/preferences/', payload);
            alert('Preferences saved successfully!');
            navigate('/feed'); // Send them back to the feed to see new matches!
        } catch (error) {
            alert('Failed to save preferences.');
        }
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', fontFamily: 'sans-serif' }}>
            <h2>Set Your Preferences</h2>
            <p>Help the Dilgorithm AI find your perfect match.</p>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                
                <label>
                    <strong>Your Interests (comma separated)</strong><br/>
                    <input 
                        type="text" 
                        value={interests} 
                        onChange={(e) => setInterests(e.target.value)} 
                        placeholder="e.g. Reading, Hiking, Cooking" 
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </label>

                <label>
                    <strong>Preferred Sect (Religious Constraint)</strong><br/>
                    <select 
                        value={sect} 
                        onChange={(e) => setSect(e.target.value)}
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    >
                        <option value="">Any</option>
                        <option value="Sunni">Sunni</option>
                        <option value="Shia">Shia</option>
                        <option value="Just Muslim">Just Muslim</option>
                    </select>
                </label>

                <label>
                    <strong>Preferred Location</strong><br/>
                    <input 
                        type="text" 
                        value={location} 
                        onChange={(e) => setLocation(e.target.value)} 
                        placeholder="e.g. Lahore, Pakistan" 
                        style={{ width: '100%', padding: '8px', marginTop: '5px' }}
                    />
                </label>

                <button type="submit" style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
                    Save AI Preferences
                </button>
                <button type="button" onClick={() => navigate('/feed')} style={{ padding: '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '5px' }}>
                    Cancel & Return to Feed
                </button>
            </form>
        </div>
    );
};