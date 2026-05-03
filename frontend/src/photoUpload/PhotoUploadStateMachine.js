/**
 * State pattern: upload flow phases and whether "Next/Continue" may proceed.
 * `isPhotoUploaded` maps to having a validated preview (ready to persist).
 */

class EmptyPhotoUploadState {
    id = 'empty';

    canProceedToNext() {
        return false;
    }

    isPhotoSelected() {
        return false;
    }
}

class ReadyPhotoUploadState {
    id = 'ready';

    canProceedToNext() {
        return true;
    }

    isPhotoSelected() {
        return true;
    }
}

class UploadingPhotoUploadState {
    id = 'uploading';

    canProceedToNext() {
        return false;
    }

    isPhotoSelected() {
        return true;
    }
}

class ErrorPhotoUploadState {
    id = 'error';

    /** @param {PhotoUploadStateMachine} machine */
    canProceedToNext(machine) {
        return Boolean(machine?.preview);
    }

    isPhotoSelected() {
        return true;
    }
}

class DonePhotoUploadState {
    id = 'done';

    canProceedToNext() {
        return false;
    }

    isPhotoSelected() {
        return true;
    }
}

export class PhotoUploadStateMachine {
    constructor() {
        /** @type {File|null} */
        this.file = null;
        /** @type {string|null} */
        this.preview = null;
        this.lastError = '';
        /** @type {EmptyPhotoUploadState|ReadyPhotoUploadState|UploadingPhotoUploadState|ErrorPhotoUploadState|DonePhotoUploadState} */
        this.state = new EmptyPhotoUploadState();
    }

    getPhase() {
        return this.state.id;
    }

    /** Hard constraint: valid image selected and ready (not necessarily saved yet). */
    isPhotoUploaded() {
        return this.state.isPhotoSelected();
    }

    canProceedToNext() {
        return this.state.canProceedToNext(this);
    }

    /**
     * @param {File} file
     * @param {string} previewDataUrl
     */
    onValidatedPick(file, previewDataUrl) {
        this.file = file;
        this.preview = previewDataUrl;
        this.lastError = '';
        this.state = new ReadyPhotoUploadState();
    }

    /** Reset pick (e.g. invalid processing) */
    onClearPick() {
        this.file = null;
        this.preview = null;
        this.lastError = '';
        this.state = new EmptyPhotoUploadState();
    }

    beginUpload() {
        if (!this.canProceedToNext() || this.state instanceof UploadingPhotoUploadState) return false;
        this.state = new UploadingPhotoUploadState();
        return true;
    }

    finishUploadSuccess() {
        this.state = new DonePhotoUploadState();
    }

    finishUploadFailure(message) {
        this.lastError = message;
        this.state = new ErrorPhotoUploadState();
    }
}
