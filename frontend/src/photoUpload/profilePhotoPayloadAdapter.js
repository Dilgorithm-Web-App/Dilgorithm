/**
 * Adapter: isolate API payload shape from UI/state.
 * Backend today expects JSON PATCH with `images` array (data URLs/strings).
 * Multipart is prepared for a future dedicated upload endpoint.
 */
export const ProfilePhotoPayloadAdapter = {
    /** Matches current `UserProfileSerializer` + PATCH /accounts/profile/ */
    buildJsonPatchBody(dataUrl) {
        return { images: [dataUrl] };
    },

    /** Use when backend exposes multipart (e.g. POST /accounts/profile/photo/) */
    buildMultipartFormData(file) {
        const fd = new FormData();
        fd.append('image', file, file.name || 'profile.jpg');
        return fd;
    },
};
