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
    _flags: parseInt(localStorage.getItem(TOKEN) || '0', 10),

    _tasks: [
        { name: '', desc: '', task: '', flag: 'purification_01' },
        { name: '', desc: '', task: '', flag: 'purification_02' },
        { name: '', desc: '', task: '', flag: 'purification_03' },
        { name: '', desc: '', task: '', flag: 'purification_04' },
        { name: '', desc: '', task: '', flag: 'purification_05' },
        { name: '', desc: '', task: '', flag: 'purification_06' },
        { name: '', desc: '', task: '', flag: 'purification_07' },
        { name: '', desc: '', task: '', flag: 'purification_08' },
    ],

    /**
     * Resets the app state.
     */
    reset: function() {
        // When resetting, set _flags to 0, save to localStorage, and ensure it's a number
        localStorage.setItem(TOKEN, 0);
        this._flags = 0; // Update the in-memory _flags as well
    },

    /**
     * Stores a flag (marks a task as completed) to the app.
     * @param {number} taskIndex - The index of the task to mark as complete.
     * @returns {boolean} Whether the flag was stored or not.
     */
    store: function(taskIndex) {
        // Check if the taskIndex is valid
        if (taskIndex < 0 || taskIndex >= this._tasks.length) {
            console.warn(`Sensei, invalid task index: ${taskIndex}. Cannot store flag.`);
            return false;
        }

        // Check if the quest is already completed
        if (FLAGS.get(this._flags, taskIndex)) {
            console.log(`Sensei, Quest ${taskIndex + 1} is already completed!`);
            return false; // Already completed, no change needed
        }

        // Set the bit for the given taskIndex to true
        this._flags = FLAGS.set(this._flags, taskIndex, true);
        localStorage.setItem(TOKEN, this._flags.toString()); // Store as string
        console.log(`Sensei, Quest ${taskIndex + 1} completed! New flags: ${this._flags}`);
        return true;
    },
};

/**
 * Detects a QR Code from a given video source.
 * @param {HTMLVideoElement} video - The video element source.
 * @param {AbortSignal} signal - The abort controller's signal used to cancel detection.
 * @returns {Promise<string>} A promise that resolves with the detected QR code value or rejects with an error.
 */
async function detect(video, signal) {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    video.srcObject = stream;

    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    const { promise, resolve, reject } = Promise.withResolvers();

    const scan = async () => {
        // Check if the signal has been aborted or stream is inactive BEFORE trying to detect
        if (signal.aborted || !stream.active) {
            resolve(null); // Resolve with null as it was intentionally stopped
            return; // Exit the function
        }

        try {
            const detected = await detector.detect(video);

            if (detected.length > 0) {
                stop();
                resolve(detected[0].rawValue);
            } else {
                requestAnimationFrame(scan); // Continue scanning
            }
        } catch (err) {
            stop();
            reject(err); // Reject with the error that occurred during detection
        }
    };

    const stop = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        video.srcObject = null;
    };

    // Listen for the abort signal to stop the stream
    signal.addEventListener('abort', stop, { once: true });

    // Wait for video metadata to load and video to play before starting scan
    await new Promise(resolve => {
        video.onloadedmetadata = () => {
            video.play();
            resolve();
        }
    });

    requestAnimationFrame(scan); // Start the scanning loop

    return promise; // Return the promise
}
