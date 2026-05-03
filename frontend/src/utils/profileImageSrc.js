/**
 * Normalize profile image strings from the API for use as <img src>.
 * Supports full data URLs, https URLs, site-relative paths, and raw base64 payloads.
 */

import profilePhotoPlaceholderUrl from '../assets/profile-photo-placeholder.svg';

/** Reject absurd payloads that would blow JSON / DB limits before render */
export const MAX_ACCEPTABLE_IMAGE_SRC_CHARS = 600_000;

/** Neutral placeholder (no initials) when no stored photo resolves. */
export function getProfilePhotoPlaceholderSrc() {
    return profilePhotoPlaceholderUrl;
}

function looksLikeBase64Payload(s) {
    const compact = s.replace(/\s/g, '');
    return compact.length >= 80 && /^[A-Za-z0-9+/]+=*$/.test(compact);
}

/** Guess MIME for raw base64 payloads (legacy rows without `data:` prefix). */
function dataUrlFromRawBase64(compact) {
    let mime = 'image/jpeg';
    if (compact.startsWith('iVBOR')) mime = 'image/png';
    else if (compact.startsWith('/9j/')) mime = 'image/jpeg';
    else if (compact.startsWith('R0lGOD')) mime = 'image/gif';
    else if (compact.startsWith('UklGR')) mime = 'image/webp';
    return `data:${mime};base64,${compact}`;
}

/**
 * @param {unknown} value single entry from profile.images[]
 * @returns {string|null} safe src for <img> or null to use fallback UI
 */
export function resolveProfileImageSrc(value) {
    if (value == null) return null;
    if (typeof value !== 'string') return null;
    const s = value.trim();
    if (!s) return null;
    if (s.length > MAX_ACCEPTABLE_IMAGE_SRC_CHARS) return null;

    if (/^data:image\//i.test(s)) return s;
    if (/^data:/i.test(s)) return s;
    if (/^https?:\/\//i.test(s)) return s;

    if (looksLikeBase64Payload(s)) {
        const compact = s.replace(/\s/g, '');
        return dataUrlFromRawBase64(compact);
    }

    if (s.startsWith('/') || s.startsWith('./')) return s;

    return null;
}

/**
 * @param {unknown} images profile.images from API
 * @returns {string|null}
 */
export function getFirstProfileImageSrc(images) {
    if (!Array.isArray(images) || images.length === 0) return null;
    return resolveProfileImageSrc(images[0]);
}

/**
 * Always returns a string suitable for <img src> — real photo or neutral placeholder (never letter fallbacks).
 * @param {unknown} images profile.images from API
 */
export function getProfilePhotoImgSrc(images) {
    return getFirstProfileImageSrc(images) ?? profilePhotoPlaceholderUrl;
}
