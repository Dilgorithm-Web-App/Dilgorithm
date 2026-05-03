import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { ProfilePhotoPayloadAdapter } from '../photoUpload/profilePhotoPayloadAdapter';
import { getProfilePhotoPlaceholderSrc, resolveProfileImageSrc } from '../utils/profileImageSrc';
import {
    imageMimeStrategy,
    maxSizeStrategy,
    validateProfileImageFile,
} from '../photoUpload/profilePhotoValidationStrategies';
import { compressImageToJpegDataUrl, MAX_STORED_PROFILE_IMAGE_CHARS } from '../utils/compressImageToJpeg';
import './EditProfilePage.css';

const PICK_STRATEGIES = [imageMimeStrategy, maxSizeStrategy];

/**
 * Edit profile photo: opening the picker and cancelling leaves server + UI unchanged.
 * DB/state updates only after a new image passes validation, compresses, and PATCH succeeds.
 */
export const EditProfilePage = () => {
    const navigate = useNavigate();
    const [savedUrl, setSavedUrl] = useState(null);
    const [fullName, setFullName] = useState('');
    const [stagedPreview, setStagedPreview] = useState(null);
    const [busy, setBusy] = useState(false);
    const [loadError, setLoadError] = useState('');
    const [saveOk, setSaveOk] = useState('');
    const [pickError, setPickError] = useState('');

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await api.get('accounts/profile/');
                if (cancelled) return;
                const imgs = Array.isArray(data.images) ? data.images : [];
                setSavedUrl(imgs.length ? imgs[0] : null);
                setFullName(data.fullName || '');
            } catch {
                if (!cancelled) setLoadError('Could not load profile.');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const displayUrl =
        stagedPreview ?? resolveProfileImageSrc(savedUrl) ?? getProfilePhotoPlaceholderSrc();

    const onPickFile = async (e) => {
        const f = e.target.files?.[0];
        setPickError('');
        setSaveOk('');
        if (!f) {
            return;
        }
        const err = validateProfileImageFile(f, PICK_STRATEGIES);
        if (err) {
            setPickError(err);
            e.target.value = '';
            return;
        }
        try {
            const dataUrl = await compressImageToJpegDataUrl(f);
            if (dataUrl.length > MAX_STORED_PROFILE_IMAGE_CHARS) {
                setPickError(
                    'Photo is still too large after compression. Try a smaller image. Your current photo was kept.',
                );
                return;
            }
            setStagedPreview(dataUrl);
        } catch {
            setPickError('Could not process this image. Your existing photo was kept.');
        }
        e.target.value = '';
    };

    const discardStaged = () => {
        setStagedPreview(null);
        setPickError('');
        setSaveOk('');
    };

    const savePhotoIfNeeded = async () => {
        if (!stagedPreview) {
            setPickError('Choose a new photo first, or go back.');
            return;
        }
        if (stagedPreview.length > MAX_STORED_PROFILE_IMAGE_CHARS) {
            setPickError('Photo exceeds storage limits. Your previous photo was not changed.');
            return;
        }
        setBusy(true);
        setPickError('');
        setSaveOk('');
        try {
            const body = ProfilePhotoPayloadAdapter.buildJsonPatchBody(stagedPreview);
            await api.patch('accounts/profile/', body);
            setSavedUrl(stagedPreview);
            setStagedPreview(null);
            setSaveOk('Profile photo updated.');
        } catch (err) {
            setPickError(err.response?.data?.detail || 'Save failed. Your previous photo is unchanged.');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="ep-page">
            <div className="ep-card">
                <button type="button" className="ep-back" onClick={() => navigate('/preferences')}>
                    Back
                </button>
                <h1 className="ep-title">Edit profile</h1>
                <p className="ep-sub">
                    {fullName ? <span className="ep-name">{fullName}</span> : null}
                    Change your photo only when you are ready — cancelling the file picker keeps your current photo.
                </p>

                {loadError ? (
                    <p className="ep-banner ep-banner--error" role="alert">
                        {loadError}
                    </p>
                ) : null}
                {saveOk ? (
                    <p className="ep-banner ep-banner--ok" role="status">
                        {saveOk}
                    </p>
                ) : null}
                {pickError ? (
                    <p className="ep-banner ep-banner--error" role="alert">
                        {pickError}
                    </p>
                ) : null}

                <div className="ep-preview-wrap ep-preview-wrap--has">
                    <img src={displayUrl} alt="Profile preview" className="ep-preview-img" />
                </div>

                {stagedPreview ? (
                    <p className="ep-hint">New photo selected — save to apply, or discard to keep your previous photo.</p>
                ) : null}

                <div className="ep-actions">
                    <label className="ep-btn ep-btn--ghost">
                        Change photo
                        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="ep-file" onChange={onPickFile} disabled={busy} />
                    </label>
                    {stagedPreview ? (
                        <button type="button" className="ep-btn ep-btn--muted" onClick={discardStaged} disabled={busy}>
                            Discard new photo
                        </button>
                    ) : null}
                    <button type="button" className="ep-btn ep-btn--primary" onClick={savePhotoIfNeeded} disabled={busy || !stagedPreview}>
                        {busy ? 'Saving…' : 'Save photo'}
                    </button>
                </div>
            </div>
        </div>
    );
};
