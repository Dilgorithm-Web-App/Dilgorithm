import { useEffect, useReducer, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dgHeartLogo from '../assets/dg_heart_logo.png';
import { PhotoUploadStateMachine } from '../photoUpload/PhotoUploadStateMachine';
import { ProfilePhotoPayloadAdapter } from '../photoUpload/profilePhotoPayloadAdapter';
import {
    imageMimeStrategy,
    maxSizeStrategy,
    validateProfileImageFile,
} from '../photoUpload/profilePhotoValidationStrategies';
import { compressImageToJpegDataUrl, MAX_STORED_PROFILE_IMAGE_CHARS } from '../utils/compressImageToJpeg';
import './RegisterPhotoPage.css';

/** Strategies for picker (empty cancel handled before validation). */
const PICK_STRATEGIES = [imageMimeStrategy, maxSizeStrategy];

/** Onboarding / post-registration “Upload photo” step — hard gate before app entry. */
export const RegisterPhotoPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const machineRef = useRef(new PhotoUploadStateMachine());
    const [, rerender] = useReducer((x) => x + 1, 0);
    const [requireHighlight, setRequireHighlight] = useState(false);

    const machine = machineRef.current;
    const sync = () => rerender();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) navigate('/login', { replace: true });
    }, [navigate]);

    const onPickFile = async (e) => {
        const f = e.target.files?.[0];
        machine.lastError = '';
        setRequireHighlight(false);
        if (!f) {
            sync();
            return;
        }
        const stratErr = validateProfileImageFile(f, PICK_STRATEGIES);
        if (stratErr) {
            machine.lastError = stratErr;
            sync();
            return;
        }
        try {
            const dataUrl = await compressImageToJpegDataUrl(f);
            if (dataUrl.length > MAX_STORED_PROFILE_IMAGE_CHARS) {
                machine.lastError =
                    'Photo is still too large after compression. Try a smaller or simpler image.';
                sync();
                return;
            }
            machine.onValidatedPick(f, dataUrl);
        } catch {
            machine.lastError = 'Could not process this image. Try another file.';
        }
        sync();
    };

    const submit = async () => {
        if (!machine.canProceedToNext()) {
            setRequireHighlight(true);
            return;
        }
        if (!machine.beginUpload()) return;
        sync();
        try {
            const body = ProfilePhotoPayloadAdapter.buildJsonPatchBody(machine.preview);
            await api.patch('accounts/profile/', body);
            machine.finishUploadSuccess();
            navigate('/home', { replace: true });
        } catch (err) {
            machine.finishUploadFailure(
                err.response?.data?.detail || 'Could not save your photo. Try again.',
            );
        }
        sync();
    };

    const phase = machine.getPhase();
    const busy = phase === 'uploading';
    const withinDbLimit =
        !machine.preview || machine.preview.length <= MAX_STORED_PROFILE_IMAGE_CHARS;
    const canContinue = machine.canProceedToNext() && !busy && withinDbLimit;
    const photoReady = machine.isPhotoUploaded();

    return (
        <div className="rp-page">
            <div className="rp-card">
                <div className="rp-brand">
                    <img src={dgHeartLogo} alt="" className="rp-logo" />
                </div>
                <h1 className="rp-title">Add your profile photo</h1>
                <p className="rp-sub">
                    Choose a clear photo of yourself. A valid image must be selected before you can continue.
                </p>

                {!machine.preview ? (
                    <div
                        className={`rp-required-banner ${requireHighlight ? 'rp-required-banner--emphasis' : ''}`}
                        role="alert"
                    >
                        Profile photo is required to continue.
                    </div>
                ) : null}

                <form
                    className="rp-form"
                    onSubmit={(e) => {
                        e.preventDefault();
                        submit();
                    }}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="rp-file-input"
                        onChange={onPickFile}
                    />

                    <button
                        type="button"
                        className="rp-pick-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={busy}
                    >
                        {photoReady ? 'Choose a different photo' : 'Choose photo'}
                    </button>

                    <div className={`rp-preview-wrap ${machine.preview ? 'rp-preview-wrap--has' : ''}`}>
                        {machine.preview ? (
                            <img src={machine.preview} alt="Your profile preview" className="rp-preview-img" />
                        ) : (
                            <span className="rp-preview-placeholder">Preview appears here after you choose a photo</span>
                        )}
                    </div>

                    <div className="rp-continue-wrap">
                        <button
                            type="submit"
                            className="rp-continue"
                            disabled={!canContinue}
                            aria-disabled={!canContinue}
                        >
                            {busy ? 'Saving…' : 'Confirm'}
                        </button>
                    </div>
                </form>

                {machine.preview && !withinDbLimit ? (
                    <p className="rp-error" role="alert">
                        Compressed photo still exceeds the storage limit. Choose a different image.
                    </p>
                ) : null}
                {machine.lastError ? <p className="rp-error">{machine.lastError}</p> : null}
            </div>
        </div>
    );
};
