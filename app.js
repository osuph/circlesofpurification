/**
 * The key used for storing progress.
 */
const TOKEN = "PURIFICATION_PROGRESS";

/**
 * Helper methods for bitwise flag manipulation.
 */
const FLAGS = {
    /**
     * Sets a bit.
     * @param {number} flags - The number to set the bit to.
     * @param {number} index - The bit index to set to.
     * @param {boolean} value - The bit value to set to.
     * @returns {number} The flags with the set value.
     */
    set: function(flags, index, value) {
        if (value) {
            return flags | (1 << index);
        } else {
            return flags & ~(1 << index);
        }
    },

    /**
     * Gets a bit.
     * @param {number} flags - The number to get the bit from.
     * @param {number} index - The bit index to get from.
     * @returns {boolean} The value of the bit from the flags.
     */
    get: function(flags, index) {
        return (flags >> index) & 1;
    }
};

/**
 * The app state.
 */
const APP = {
    _state: localStorage.getItem(TOKEN) ?? 0,

    _flags: [
        "purification_01",
        "purification_02",
        "purification_03",
        "purification_04",
        "purification_05",
        "purification_06",
        "purification_07",
        "purification_08",
    ],

    /**
     * Resets the app state.
     */
    reset: function() {
        localStorage.setItem(TOKEN, this._state = 0);
    },

    /**
     * Stores a flag to the app.
     * @param {string} flag - The flag to store.
     * @returns {boolean} Whether the flag was stored or not.
     */
    store: function(flag) {
        const index = this._flags.indexOf(flag);

        if (flag < 0) {
            return false;
        }

        localStorage.setItem(TOKEN, this._state = FLAGS.set(this._state, index, true));
        return true;
    },
};

/**
 * Detects a QR Code from a given video source.
 * @param {HTMLVideoElement} video - The video element source.
 * @param {AbortSignal} signal - The abort controller's signal used to cancel detection.
 * @returns {string} The detected QR code value.
 */
async function detect(video, signal) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const { promise, resolve, reject } = Promise.withResolvers();

    const scan = async () => {
        if (signal.aborted || !stream.active) {
            resolve(null);
        }

        try {
            const detected = await detector.detect(video);

            if (detected.length > 0) {
                stop();
                resolve(detected[0].rawValue);
            } else {
                requestAnimationFrame(scan);
            }
        } catch (err) {
            reject(err);
        }
    };

    const stop = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        video.srcObject = null;
    };

    signal.addEventListener('abort', stop, { once: true });

    await new Promise(resolve => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        }
    });

    requestAnimationFrame(scan);

    return promise;
}
