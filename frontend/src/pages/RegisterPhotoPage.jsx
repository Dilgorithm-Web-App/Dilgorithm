import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import dgHeartLogo from '../assets/dg_heart_logo.png';
import './RegisterPhotoPage.css';

const MAX_FILE_BYTES = 8 * 1024 * 1024;

function compressImageToJpegDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const maxSide = 512;
                let { width, height } = img;
                if (width > maxSide || height > maxSide) {
                    if (width >= height) {
                        height = Math.round((height * maxSide) / width);
                        width = maxSide;
                    } else {
                        width = Math.round((width * maxSide) / height);
                        height = maxSide;
                    }
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.88));
            };
            img.onerror = () => reject(new Error('Could not read image.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });
}

export const RegisterPhotoPage = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [file, setFile] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            navigate('/login', { replace: true });
        }
    }, [navigate]);

    const onPickFile = async (e) => {
        const f = e.target.files?.[0];
        setError('');
        if (!f) {
            setFile(null);
            setPreview(null);
            return;
        }
        if (!f.type.startsWith('image/')) {
            setError('Please choose an image file.');
            return;
        }
        if (f.size > MAX_FILE_BYTES) {
            setError('Image is too large. Use one under 8 MB.');
            return;
        }
        setFile(f);
        try {
            const dataUrl = await compressImageToJpegDataUrl(f);
            setPreview(dataUrl);
        } catch {
            setError('Could not process this image. Try another file.');
            setFile(null);
            setPreview(null);
        }
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!preview || !file) {
            setError('Add a profile photo to continue.');
            return;
        }
        setBusy(true);
        setError('');
        try {
            await api.patch('accounts/profile/', { images: [preview] });
            navigate('/home', { replace: true });
        } catch (err) {
            setError(err.response?.data?.detail || 'Could not save your photo. Try again.');
        } finally {
            setBusy(false);
        }
    };

    const canContinue = Boolean(preview) && !busy;

    return (
        <div className="rp-page">
            <div className="rp-card">
                <div className="rp-brand">
                    <img src={dgHeartLogo} alt="" className="rp-logo" />
                </div>
                <h1 className="rp-title">Add your profile photo</h1>
                <p className="rp-sub">
                    Choose a clear photo of yourself. You need to add one before you can enter the app.
                </p>

                <form className="rp-form" onSubmit={submit}>
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
                        {preview ? 'Choose a different photo' : 'Choose photo'}
                    </button>

                    <div className={`rp-preview-wrap ${preview ? 'rp-preview-wrap--has' : ''}`}>
                        {preview ? (
                            <img src={preview} alt="Your preview" className="rp-preview-img" />
                        ) : (
                            <span className="rp-preview-placeholder">No photo yet</span>
                        )}
                    </div>

                    <button type="submit" className="rp-continue" disabled={!canContinue}>
                        {busy ? 'Saving…' : 'Continue to Dilgorithm'}
                    </button>
                </form>

                {error ? <p className="rp-error">{error}</p> : null}
            </div>
        </div>
    );
};
