/** Original file size gate before we read into memory */
export const MAX_PROFILE_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Target max length for the data URL string stored in JSON `images[]`.
 * Base64 expands ~4/3; ~320k chars ≈ ~240 KB binary — conservative for SQLite TEXT / practical JSON payloads.
 */
export const MAX_STORED_PROFILE_IMAGE_CHARS = 320_000;

function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Could not read image.'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read file.'));
        reader.readAsDataURL(file);
    });
}

function scaleDimensions(naturalWidth, naturalHeight, maxSide) {
    let width = naturalWidth;
    let height = naturalHeight;
    if (width <= maxSide && height <= maxSide) return { width, height };
    if (width >= height) {
        height = Math.round((height * maxSide) / width);
        width = maxSide;
    } else {
        width = Math.round((width * maxSide) / height);
        height = maxSide;
    }
    return { width, height };
}

function encodeJpegDataUrl(img, maxSide, quality) {
    const { width, height } = scaleDimensions(img.naturalWidth, img.naturalHeight, maxSide);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
}

/**
 * Resize + JPEG encode; shrinks quality / dimensions until under maxChars when possible.
 * @param {File} file
 * @param {{ quality?: number, maxSide?: number, maxChars?: number }} [options]
 */
export async function compressImageToJpegDataUrl(file, options = {}) {
    let quality = options.quality ?? 0.82;
    let maxSide = options.maxSide ?? 512;
    const maxChars = options.maxChars ?? MAX_STORED_PROFILE_IMAGE_CHARS;

    const img = await loadImageFromFile(file);

    const encode = () => encodeJpegDataUrl(img, maxSide, quality);

    let dataUrl = encode();
    let iterations = 0;

    while (dataUrl.length > maxChars && iterations < 30) {
        iterations += 1;
        if (quality > 0.52) {
            quality -= 0.055;
        } else if (maxSide > 200) {
            maxSide = Math.max(180, Math.floor(maxSide * 0.84));
        } else if (quality > 0.36) {
            quality -= 0.035;
        } else {
            break;
        }
        dataUrl = encode();
    }

    return dataUrl;
}
