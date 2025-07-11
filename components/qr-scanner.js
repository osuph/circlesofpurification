// components/qr-code-scanner.js
class QrCodeScanner extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.videoElement = null;
    this.abortController = null;
    this.targetTaskIndex = null;
  }

  static get observedAttributes() {
    return ['target-task-index'];
  }

  attributeChangedCallback(name, newValue) {
    if (name === 'target-task-index') {
      this.targetTaskIndex = parseInt(newValue, 10);
      if (this.isConnected) {
        this.render();
        this.startScanner();
      }
    }
  }

  connectedCallback() {
    window.addEventListener('show-qr-scanner', this._handleShowScanner.bind(this));
    this.render();
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
        <p class="message" id="scanner-message">Waiting for camera access...</p>
        <sl-button variant="neutral" onclick="this.closest('qr-code-scanner').dismiss()">Cancel Scan</sl-button>
      </div>
    `;
    this.videoElement = this.shadowRoot.getElementById('scanner-video');
    this.startScanner();
  }

  async startScanner() {
    this.stopScanner();

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
      if (err.name === 'NotAllowedError') {
          this.showMessage('Camera access denied. Please allow camera permissions to scan, Sensei!', true);
          this.showFailureModal('Camera access denied. Please allow permissions.'); // Show failure modal
      } else if (err.name === 'NotFoundError') {
          this.showMessage('No camera found on this device. Please check your setup, Sensei!', true);
          this.showFailureModal('No camera found on this device.'); // Show failure modal
      } else {
          this.showMessage(`Error during scan: ${err.message}. Please try again.`, true);
          this.showFailureModal(`Error: ${err.message}`); // Show failure modal
      }
      this.dismiss(); // Dismiss scanner on camera error
    }
  }

  stopScanner() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
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
    this.stopScanner(); // Stop scanning once a result is found

    const targetTask = APP._tasks[this.targetTaskIndex];

    if (!targetTask) {
        this.showMessage('Invalid quest data. Please consult the staff, Sensei!', true);
        this.showFailureModal('Invalid quest data. Please consult the staff!');
        this.dismiss();
        return;
    }

    if (targetTask.flag === scannedData) {
      this.showMessage('QR code matched! Marking quest complete...', false);
      window.dispatchEvent(new CustomEvent('quest-completed', { detail: { taskIndex: this.targetTaskIndex } }));
      this.showSuccessModal(); // Show success modal
      this.dismiss(); // Dismiss scanner immediately after success
    } else {
      this.showMessage('QR code mismatch or invalid for this quest. Please try again, Sensei!', true);
      this.showFailureModal('QR code mismatch or invalid. Please try again!'); // Show failure modal
      this.dismiss(); // Dismiss scanner after failure
    }
  }

  // New method to display success modal
  showSuccessModal() {
    const successModal = document.createElement('quest-success-modal');
    document.body.appendChild(successModal); // Append to body to ensure it's on top
  }

  // New method to display failure modal
  showFailureModal(message = 'An unexpected error occurred.') {
    const failureModal = document.createElement('quest-failure-modal');
    // You could pass the specific message as an attribute if quest-failure-modal supports it
    // For now, it uses its internal default message
    document.body.appendChild(failureModal); // Append to body to ensure it's on top
  }

  dismiss() {
    this.stopScanner();
    this.remove();
    window.dispatchEvent(new CustomEvent('scanner-dismissed'));
  }
}

customElements.define('qr-code-scanner', QrCodeScanner);
