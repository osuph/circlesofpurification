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
/**
 * The app state.
 */
const APP = {
    _flags: parseInt(localStorage.getItem(TOKEN) || '0', 10),
    _tasks: [], // Initialize as empty, will be loaded asynchronously

    _tasksLoaded: false, // Property to indicate if tasks are loaded

    /**
     * Initializes the app by loading tasks from JSON.
     * Call this at the start of your application.
     */
    init: async function() {
        try {
            // Fetch the JSON file
            const response = await fetch('/tasks.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this._tasks = await response.json();

            // Optional: Log tasks to verify
            console.log('Tasks loaded from JSON:', this._tasks);

            this._tasksLoaded = true; // Mark tasks as loaded
            // Dispatch an event to let components know tasks are ready
            window.dispatchEvent(new CustomEvent('app-tasks-loaded'));

        } catch (error) {
            console.error('Failed to load tasks from JSON:', error);
            // Handle error, e.g., display a message to the user
            alert('Failed to load tasks, please check your network and try again.');
        }
    },

    /**
     * Resets the app state.
     */
    reset: function() {
        localStorage.setItem(TOKEN, 0);
        this._flags = 0; // Update the in-memory _flags as well
        console.log('Sensei! All quest progress has been reset!');
    },

    /**
     * Stores a flag (marks a task as completed) to the app.
     * @param {number} taskIndex - The index of the task to mark as complete.
     * @returns {boolean} Whether the flag was stored or not.
     */
    store: function(taskIndex) {
        // Ensure tasks are loaded before trying to store
        if (!this._tasksLoaded) {
            console.warn('Sensei, tasks are not loaded yet. Cannot store flag.');
            return false;
        }

        if (taskIndex < 0 || taskIndex >= this._tasks.length) {
            console.warn(`Sensei, invalid task index: ${taskIndex}. Cannot store flag.`);
            return false;
        }

        if (FLAGS.get(this._flags, taskIndex)) {
            console.log(`Quest ${taskIndex + 1} is already completed!`);
            return false;
        }

        this._flags = FLAGS.set(this._flags, taskIndex, true);
        localStorage.setItem(TOKEN, this._flags.toString()); // Store as string
        console.log(`Quest ${taskIndex + 1} completed! New flags: ${this._flags}`);
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

export { APP, FLAGS, TOKEN, detect };
