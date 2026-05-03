import React, { useState, useEffect } from 'react';
import api from '../api';

export const FamilyForm = () => {
    const [familyMembers, setFamilyMembers] = useState([]);
    const [relationship, setRelationship] = useState('Father');
    const [occupation, setOccupation] = useState('');
    const [education, setEducation] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchFamilyMembers = async () => {
        try {
            setLoading(true);
            const response = await api.get('accounts/family-members/');
            setFamilyMembers(response.data);
        } catch (error) {
            console.error('Failed to load family members:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFamilyMembers();
    }, []);

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            await api.post('accounts/family-members/', {
                relationship,
                occupation,
                education
            });
            // Reset form
            setRelationship('Father');
            setOccupation('');
            setEducation('');
            // Refresh list
            fetchFamilyMembers();
        } catch (error) {
            console.error('Failed to add family member:', error);
            alert('Could not add family member. Please try again.');
        }
    };

    const containerStyle = {
        marginTop: '30px',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9'
    };

    const inputStyle = {
        width: '100%',
        padding: '8px',
        marginTop: '5px',
        marginBottom: '10px',
        borderRadius: '4px',
        border: '1px solid #ccc'
    };

    const buttonStyle = {
        padding: '10px 15px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer'
    };

    return (
        <div style={containerStyle}>
            <h3>Family Members</h3>
            <p>Add family members to improve AI matching accuracy (e.g., matching similar backgrounds).</p>
            
            {loading ? (
                <p>Loading family members...</p>
            ) : (
                <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                    {familyMembers.length === 0 && <li>No family members added yet.</li>}
                    {familyMembers.map((member) => (
                        <li key={member.id} style={{ marginBottom: '10px' }}>
                            <strong>{member.relationship}</strong>
                            {member.occupation && ` - ${member.occupation}`}
                            {member.education && ` (Edu: ${member.education})`}
                        </li>
                    ))}
                </ul>
            )}

            <h4>Add New Family Member</h4>
            <form onSubmit={handleAddMember}>
                <label>
                    <strong>Relationship</strong><br />
                    <select
                        value={relationship}
                        onChange={(e) => setRelationship(e.target.value)}
                        style={inputStyle}
                        required
                    >
                        <option value="Father">Father</option>
                        <option value="Mother">Mother</option>
                        <option value="Brother">Brother</option>
                        <option value="Sister">Sister</option>
                        <option value="Guardian">Guardian</option>
                        <option value="Other">Other</option>
                    </select>
                </label>

                <label>
                    <strong>Occupation</strong><br />
                    <input
                        type="text"
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Medicine, Engineering, Business"
                        style={inputStyle}
                    />
                </label>

                <label>
                    <strong>Education</strong><br />
                    <input
                        type="text"
                        value={education}
                        onChange={(e) => setEducation(e.target.value)}
                        placeholder="e.g. Bachelors, Masters, PhD"
                        style={inputStyle}
                    />
                </label>

                <button type="submit" style={buttonStyle}>Add Family Member</button>
            </form>
        </div>
    );
};
