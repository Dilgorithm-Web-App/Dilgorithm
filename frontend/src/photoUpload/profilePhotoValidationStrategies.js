import { MAX_PROFILE_IMAGE_BYTES } from '../utils/compressImageToJpeg';

/**
 * Strategy pattern: each rule is independent; compose without coupling UI.
 * @typedef {{ validate: (file: File | null | undefined) => string | null }} ProfileImageValidationStrategy
 */

/** @type {ProfileImageValidationStrategy} */
export const requiredFileStrategy = {
    validate: (file) => (file ? null : 'Please choose a photo.'),
};

/** @type {ProfileImageValidationStrategy} */
export const imageMimeStrategy = {
    validate: (file) => {
        if (!file) return null;
        return file.type.startsWith('image/') ? null : 'Please choose an image file (JPEG, PNG, WebP, or GIF).';
    },
};

/** @type {ProfileImageValidationStrategy} */
export const maxSizeStrategy = {
    validate: (file) => {
        if (!file) return null;
        return file.size <= MAX_PROFILE_IMAGE_BYTES ? null : 'Image is too large. Use one under 8 MB.';
    },
};

/** Default pipeline for profile picker validation */
export const defaultProfileImageStrategies = [requiredFileStrategy, imageMimeStrategy, maxSizeStrategy];

/**
 * Runs strategies in order; returns first error message or null if valid.
 * @param {File | null | undefined} file
 * @param {ProfileImageValidationStrategy[]} strategies
 */
export function validateProfileImageFile(file, strategies = defaultProfileImageStrategies) {
    for (const s of strategies) {
        const msg = s.validate(file);
        if (msg) return msg;
    }
    return null;
}
