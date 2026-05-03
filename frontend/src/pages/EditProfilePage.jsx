import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { compressImageToJpegDataUrl, MAX_STORED_PROFILE_IMAGE_CHARS } from '../utils/compressImageToJpeg';
import {
    imageMimeStrategy,
    maxSizeStrategy,
    validateProfileImageFile,
} from '../photoUpload/profilePhotoValidationStrategies';
import { resolveProfileImageSrc } from '../utils/profileImageSrc';
import './EditProfilePage.css';

import { PageState } from '../patterns/PageState';
import { eventBus } from '../patterns/EventBus';

const PICK_STRATEGIES = [imageMimeStrategy, maxSizeStrategy];

const adaptProfileToForm = (data) => ({
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

export const EditProfilePage = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        bio: '',
        profession: '',
        education: '',
        location: '',
        maritalStatus: '',
        sect: '',
        caste: '',
        dateOfBirth: '',
    });
    const [preview, setPreview] = useState(null);
    const [pageState, setPageState] = useState(PageState.idle());
    const [status, setStatus] = useState('');

    useEffect(() => {
        const load = async () => {
            setPageState(PageState.loading());
            try {
                const { data } = await api.get('accounts/profile/');
                setForm(adaptProfileToForm(data));
                const imgs = Array.isArray(data.images) ? data.images : [];
                const first = imgs.length ? resolveProfileImageSrc(imgs[0]) : null;
                if (first) setPreview(first);
                else if (data.profileImage) setPreview(data.profileImage);
                setPageState(PageState.loaded(data));
            } catch {
                setStatus('Could not load profile.');
                setPageState(PageState.error('Could not load profile.'));
            }
        };
        load();
    }, []);

    const handleChange = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

    const onPickFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const err = validateProfileImageFile(f, PICK_STRATEGIES);
        if (err) {
            setStatus(err);
            e.target.value = '';
            return;
        }
        try {
            const url = await compressImageToJpegDataUrl(f);
            if (url.length > MAX_STORED_PROFILE_IMAGE_CHARS) {
                setStatus('Photo is still too large after compression. Try a smaller image.');
                return;
            }
            setPreview(url);
            setStatus('');
        } catch {
            setStatus('Could not process image.');
        }
        e.target.value = '';
    };

    const save = async (e) => {
        e.preventDefault();
        setPageState(pageState.toSaving());
        setStatus('');
        try {
            const payload = { ...form };
            if (preview) payload.images = [preview];
            await api.patch('accounts/profile/', payload);
            setStatus('Profile saved successfully!');
            setPageState(PageState.loaded(form));
            eventBus.publish('profile.saved', { form });
            setTimeout(() => navigate('/settings'), 1200);
        } catch (err) {
            setStatus(err.response?.data?.detail || 'Failed to save.');
            setPageState(PageState.error('Failed to save.'));
        }
    };

    const busy = pageState.isSaving;

    return (
        <div className="ep-wrap">
            <div className="ep-card">
                <button type="button" className="ep-back" onClick={() => navigate('/settings')}>
                    ← Back
                </button>
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
                            {preview ? (
                                <img src={preview} alt="Profile" className="ep-photo" />
                            ) : (
                                <div className="ep-photo-placeholder">No photo</div>
                            )}
                        </div>
                        <label className="ep-photo-btn">
                            Change Photo
                            <input type="file" accept="image/*" onChange={onPickFile} hidden />
                        </label>
                    </div>

                    <div className="ep-field">
                        <label className="ep-label">Full Name</label>
                        <input
                            className="ep-input"
                            value={form.fullName}
                            onChange={(e) => handleChange('fullName', e.target.value)}
                            required
                        />
                    </div>
                    <div className="ep-field">
                        <label className="ep-label">Bio</label>
                        <textarea
                            className="ep-textarea"
                            value={form.bio}
                            onChange={(e) => handleChange('bio', e.target.value)}
                            rows={3}
                            placeholder="Tell people about yourself..."
                        />
                    </div>
                    <div className="ep-field">
                        <label className="ep-label">Date of Birth</label>
                        <input
                            className="ep-input"
                            type="date"
                            value={form.dateOfBirth}
                            onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                        />
                    </div>

                    <div className="ep-row">
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Profession</label>
                            <input
                                className="ep-input"
                                value={form.profession}
                                onChange={(e) => handleChange('profession', e.target.value)}
                                placeholder="e.g. Software Engineer"
                            />
                        </div>
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Education</label>
                            <select
                                className="ep-select"
                                value={form.education}
                                onChange={(e) => handleChange('education', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="High School">High School</option>
                                <option value="Bachelors">Bachelors</option>
                                <option value="Masters">Masters</option>
                                <option value="PhD">PhD</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                    <div className="ep-row">
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Location</label>
                            <input
                                className="ep-input"
                                value={form.location}
                                onChange={(e) => handleChange('location', e.target.value)}
                                placeholder="e.g. Lahore"
                            />
                        </div>
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Marital Status</label>
                            <select
                                className="ep-select"
                                value={form.maritalStatus}
                                onChange={(e) => handleChange('maritalStatus', e.target.value)}
                            >
                                <option value="">Select</option>
                                <option value="Single">Single</option>
                                <option value="Divorced">Divorced</option>
                                <option value="Widowed">Widowed</option>
                            </select>
                        </div>
                    </div>
                    <div className="ep-row">
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Sect</label>
                            <select className="ep-select" value={form.sect} onChange={(e) => handleChange('sect', e.target.value)}>
                                <option value="">Select</option>
                                <option value="Sunni">Sunni</option>
                                <option value="Shia">Shia</option>
                                <option value="Just Muslim">Just Muslim</option>
                            </select>
                        </div>
                        <div className="ep-field ep-field--half">
                            <label className="ep-label">Caste</label>
                            <select className="ep-select" value={form.caste} onChange={(e) => handleChange('caste', e.target.value)}>
                                <option value="">Select</option>
                                <option value="Syed">Syed</option>
                                <option value="Sheikh">Sheikh</option>
                                <option value="Pathan">Pathan</option>
                                <option value="Mughal">Mughal</option>
                                <option value="Rajput">Rajput</option>
                                <option value="Arain">Arain</option>
                                <option value="Jat">Jat</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="ep-actions">
                        <button type="submit" className="ep-save" disabled={busy}>
                            {busy ? 'Saving…' : 'Save Profile'}
                        </button>
                        <button type="button" className="ep-cancel" onClick={() => navigate('/settings')}>
                            Cancel
                        </button>
                    </div>
                    {status && <p className={`ep-status ${status.includes('success') ? 'ep-status--ok' : ''}`}>{status}</p>}
                </form>
            </div>
        </div>
    );
};
