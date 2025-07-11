import { APP, detect } from '../app.js';

class QrCodeScanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.videoElement = null;
    this.abortController = null;
    this.targetTaskIndex = null;
    this.errorMessage = '';
  }

  static get observedAttributes() {
    return ['target-task-index'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'target-task-index') {
      this.targetTaskIndex = parseInt(newValue, 10);
      if (this.isConnected) {
        if (oldValue !== newValue) {
          this.render();
        }
      }
    }
  }

  connectedCallback() {
    if (this.targetTaskIndex !== null && !this.videoElement) {
        this.render();
    }
    window.addEventListener('show-qr-scanner', this._handleShowScanner.bind(this));
  }

  disconnectedCallback() {
    this.stopScanner();
    window.removeEventListener('show-qr-scanner', this._handleShowScanner.bind(this));
  }

  _handleShowScanner(event) {
      const { taskIndex } = event.detail;
      this.setAttribute('target-task-index', taskIndex);
  }

  render() {
    const task = APP._tasks[this.targetTaskIndex];
    const questName = task ? (task.name || `Quest ${this.targetTaskIndex + 1}`) : 'Unknown Quest';

    const currentMessage = this.errorMessage || 'Waiting for camera access...';
    const isErrorMessage = !!this.errorMessage;

    this.shadowRoot.innerHTML = `
      <style>
        .scanner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 2000;
          color: var(--sl-color-neutral-100);
          gap: var(--sl-spacing-large);
          font-family: var(--sl-font-sans);
        }

        h2 {
          color: var(--sl-color-primary-300);
          margin-bottom: var(--sl-spacing-medium);
          text-align: center;
        }

        #video-container {
          width: 90%;
          max-width: 500px;
          aspect-ratio: 1 / 1;
          background-color: black;
          border: 2px solid var(--sl-color-primary-500);
          border-radius: var(--sl-border-radius-medium);
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        #scanner-video {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .message {
          margin-top: var(--sl-spacing-medium);
          font-size: var(--sl-font-size-medium);
          color: var(--sl-color-neutral-300);
          text-align: center;
        }

        .error-message {
          color: var(--sl-color-danger-300);
          font-weight: var(--sl-font-weight-bold);
        }

        sl-button {
            margin-top: var(--sl-spacing-large);
        }
      </style>
      <div class="scanner-overlay">
        <h2>Scan QR Code for: ${questName}</h2>
        <div id="video-container">
            <video id="scanner-video" playsinline></video>
        </div>
        <p class="message ${isErrorMessage ? 'error-message' : ''}" id="scanner-message">${currentMessage}</p>
        <sl-button variant="neutral" id="cancel-button">Cancel Scan</sl-button>
      </div>
    `;
    this.videoElement = this.shadowRoot.getElementById('scanner-video');

    const cancelButton = this.shadowRoot.getElementById('cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.dismiss());
    }

    if (!this.errorMessage) {
      this.startScanner();
    }
  }

  async startScanner() {
    this.stopScanner();
    this.errorMessage = '';

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      this.showMessage('Accessing camera, Sensei...', false);
      const scannedData = await detect(this.videoElement, signal);

      if (signal.aborted) {
        this.showMessage('Scan cancelled.', false);
        return;
      }

      this.handleScanResult(scannedData);

    } catch (err) {
      console.error('QR Code Scan Error:', err);
      const userMessage = 'QR code scanner not available due to a camera error. Please try again later, Sensei!';

      this.errorMessage = userMessage;
      this.showMessage(userMessage, true);
      const failureModal = document.createElement('app-modal');
      failureModal.setAttribute('title', 'Scanner Error!');
      failureModal.setAttribute('message', userMessage);
      failureModal.setAttribute('icon', 'camera-video-off');
      failureModal.setAttribute('type', 'error');
      failureModal.setAttribute('auto-dismiss-delay', '0');
      document.body.appendChild(failureModal);
    }
  }

  stopScanner() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const tracks = this.videoElement.srcObject.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  showMessage(message, isError = false) {
    const msgElement = this.shadowRoot.getElementById('scanner-message');
    if (msgElement) {
      msgElement.textContent = message;
      msgElement.classList.toggle('error-message', isError);
    }
  }

  handleScanResult(scannedData) {
    this.stopScanner();

    const targetTask = APP._tasks[this.targetTaskIndex];

    // Case 1: Invalid quest data or tasks not loaded
    if (!APP._tasksLoaded || !targetTask) {
        this.showMessage('Invalid quest data. Please consult the staff, Sensei!', true);
        // Use AppModal for this failure
        const failureModal = document.createElement('app-modal');
        failureModal.setAttribute('title', 'Data Error!');
        failureModal.setAttribute('message', 'Invalid quest data. Please consult the staff!');
        failureModal.setAttribute('icon', 'exclamation-triangle');
        failureModal.setAttribute('type', 'error');
        failureModal.setAttribute('auto-dismiss-delay', '0'); // Manual dismissal
        document.body.appendChild(failureModal);

        // Keep scanner visible for a moment, then dismiss it
        setTimeout(() => this.dismiss(), 3000);
        return;
    }

    // Case 2: QR code matched - success
    if (targetTask.flag === scannedData) {
      this.showMessage('QR code matched! Marking quest complete...', false);
      window.dispatchEvent(new CustomEvent('quest-completed', { detail: { taskIndex: this.targetTaskIndex } }));
      // Use AppModal for success
      const successModal = document.createElement('app-modal');
      successModal.setAttribute('title', 'Quest Completed!');
      successModal.setAttribute('message', 'Excellent work! Your efforts are always appreciated!');
      successModal.setAttribute('icon', 'check-circle');
      successModal.setAttribute('type', 'success');
      successModal.setAttribute('auto-dismiss-delay', '3000'); // Auto-dismiss after 3 seconds
      document.body.appendChild(successModal);

      this.dismiss();
    }
    // Case 3: QR code mismatch or invalid
    else {
      const failureReason = `QR code mismatch or invalid for "${targetTask.name || `Quest ${this.targetTaskIndex + 1}`}".`;
      this.showMessage(`${failureReason} Please try again!`, true);
      // Use AppModal for mismatch failure
      const failureModal = document.createElement('app-modal');
      failureModal.setAttribute('title', 'QR Code Mismatch!');
      failureModal.setAttribute('message', 'QR code invalid for this quest. Please try again!');
      failureModal.setAttribute('icon', 'x-octagon');
      failureModal.setAttribute('type', 'error');
      failureModal.setAttribute('auto-dismiss-delay', '0');
      document.body.appendChild(failureModal);

      // Keep scanner visible for a moment, then dismiss it
      setTimeout(() => this.dismiss(), 3000);
    }
  }

  dismiss() {
    this.stopScanner();
    this.remove();
    window.dispatchEvent(new CustomEvent('scanner-dismissed'));
  }
}

customElements.define('qr-code-scanner', QrCodeScanner);
