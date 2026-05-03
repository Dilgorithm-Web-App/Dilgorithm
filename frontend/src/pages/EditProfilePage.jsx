import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import './EditProfilePage.css';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function compressImageToJpeg(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const max = 512;
                let { width: w, height: h } = img;
                if (w > max || h > max) { if (w >= h) { h = Math.round((h * max) / w); w = max; } else { w = Math.round((w * max) / h); h = max; } }
                const c = document.createElement('canvas'); c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                resolve(c.toDataURL('image/jpeg', 0.88));
            };
            img.onerror = () => reject(new Error('Bad image'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Read fail'));
        reader.readAsDataURL(file);
    });
}

export const EditProfilePage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName:'', bio:'', profession:'', education:'', location:'', maritalStatus:'', sect:'', caste:'', dateOfBirth:'' });
    const [preview, setPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [status, setStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const { data } = await api.get('accounts/profile/');
                setForm({
                    fullName: data.fullName || '',
                    bio: data.bio || '',
                    profession: data.profession || '',
                    education: data.education || '',
                    location: data.location || '',
                    maritalStatus: data.maritalStatus || '',
                    sect: data.sect || '',
                    caste: data.caste || '',
                    dateOfBirth: data.dateOfBirth || '',
                });
                if (data.profileImage) setPreview(data.profileImage);
            } catch { setStatus('Could not load profile.'); }
        };
        load();
    }, []);

    const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

    const onPickFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (!f.type.startsWith('image/') || f.size > MAX_FILE_BYTES) { setStatus('Invalid image (must be < 8MB).'); return; }
        try { const url = await compressImageToJpeg(f); setPreview(url); } catch { setStatus('Could not process image.'); }
    };

    const save = async (e) => {
        e.preventDefault();
        setBusy(true); setStatus('');
        try {
            const payload = { ...form };
            if (preview) payload.images = [preview];
            await api.patch('accounts/profile/', payload);
            setStatus('Profile saved successfully!');
            setTimeout(() => navigate('/settings'), 1200);
        } catch (err) {
            setStatus(err.response?.data?.detail || 'Failed to save.');
        }
        setBusy(false);
    };

    return (
        <div className="ep-wrap">
            <div className="ep-card">
                <button className="ep-back" onClick={() => navigate('/settings')}>← Back</button>
                <h1 className="ep-title">Edit Profile</h1>
                <p className="ep-sub">Update your personal information</p>
                <p className="ep-crosslink">
                    <button type="button" className="ep-crosslink-btn" onClick={() => navigate('/preferences')}>
                        Edit match preferences & interests →
                    </button>
                </p>

                <form className="ep-form" onSubmit={save}>
                    <div className="ep-photo-section">
                        <div className="ep-photo-preview">
                            {preview ? <img src={preview} alt="Profile" className="ep-photo" /> : <div className="ep-photo-placeholder">No photo</div>}
                        </div>
                        <label className="ep-photo-btn">
                            Change Photo
                            <input type="file" accept="image/*" onChange={onPickFile} hidden />
                        </label>
                    </div>

                    <div className="ep-field"><label className="ep-label">Full Name</label><input className="ep-input" value={form.fullName} onChange={e => handleChange('fullName', e.target.value)} required /></div>
                    <div className="ep-field"><label className="ep-label">Bio</label><textarea className="ep-textarea" value={form.bio} onChange={e => handleChange('bio', e.target.value)} rows={3} placeholder="Tell people about yourself..." /></div>
                    <div className="ep-field"><label className="ep-label">Date of Birth</label><input className="ep-input" type="date" value={form.dateOfBirth} onChange={e => handleChange('dateOfBirth', e.target.value)} /></div>

                    <div className="ep-row">
                        <div className="ep-field ep-field--half"><label className="ep-label">Profession</label><input className="ep-input" value={form.profession} onChange={e => handleChange('profession', e.target.value)} placeholder="e.g. Software Engineer" /></div>
                        <div className="ep-field ep-field--half"><label className="ep-label">Education</label>
                            <select className="ep-select" value={form.education} onChange={e => handleChange('education', e.target.value)}>
                                <option value="">Select</option><option value="High School">High School</option><option value="Bachelors">Bachelors</option><option value="Masters">Masters</option><option value="PhD">PhD</option><option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="ep-row">
                        <div className="ep-field ep-field--half"><label className="ep-label">Location</label><input className="ep-input" value={form.location} onChange={e => handleChange('location', e.target.value)} placeholder="e.g. Lahore" /></div>
                        <div className="ep-field ep-field--half"><label className="ep-label">Marital Status</label>
                            <select className="ep-select" value={form.maritalStatus} onChange={e => handleChange('maritalStatus', e.target.value)}>
                                <option value="">Select</option><option value="Single">Single</option><option value="Divorced">Divorced</option><option value="Widowed">Widowed</option>
                            </select>
                        </div>
                    </div>
                    <div className="ep-row">
                        <div className="ep-field ep-field--half"><label className="ep-label">Sect</label>
                            <select className="ep-select" value={form.sect} onChange={e => handleChange('sect', e.target.value)}>
                                <option value="">Select</option><option value="Sunni">Sunni</option><option value="Shia">Shia</option><option value="Just Muslim">Just Muslim</option>
                            </select>
                        </div>
                        <div className="ep-field ep-field--half"><label className="ep-label">Caste</label>
                            <select className="ep-select" value={form.caste} onChange={e => handleChange('caste', e.target.value)}>
                                <option value="">Select</option><option value="Syed">Syed</option><option value="Sheikh">Sheikh</option><option value="Pathan">Pathan</option><option value="Mughal">Mughal</option><option value="Rajput">Rajput</option><option value="Arain">Arain</option><option value="Jat">Jat</option><option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="ep-actions">
                        <button type="submit" className="ep-save" disabled={busy}>{busy ? 'Saving…' : 'Save Profile'}</button>
                        <button type="button" className="ep-cancel" onClick={() => navigate('/settings')}>Cancel</button>
                    </div>
                    {status && <p className={`ep-status ${status.includes('success') ? 'ep-status--ok' : ''}`}>{status}</p>}
                </form>
            </div>
        </div>
    );
};
