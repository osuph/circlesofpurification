import { APP, detect } from '../app';
import confetti from 'canvas-confetti';
import '../shoelace-setup';
import type { ShowQrScannerEventDetail, QuestCompletedEventDetail } from '../types';

class QrCodeScanner extends HTMLElement {
  private videoElement: HTMLVideoElement | null;
  private abortController: AbortController | null;
  private targetTaskIndex: number | null;
  private errorMessage: string;
  private readonly _handleShowScanner: (event: Event) => void;

  constructor() {
    super();
    // Remove Shadow DOM - render directly to light DOM for proper modal behavior
    this.videoElement = null;
    this.abortController = null;
    this.targetTaskIndex = null;
    this.errorMessage = '';
    this._handleShowScanner = this._handleShowScannerEvent.bind(this);
  }

  static get observedAttributes(): string[] {
    return ['target-task-index'];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (name === 'target-task-index') {
      this.targetTaskIndex = parseInt(newValue || '0', 10);
      if (this.isConnected) {
        if (oldValue !== newValue) {
          this.render();
        }
      }
    }
  }

  connectedCallback(): void {
    if (this.targetTaskIndex !== null && !this.videoElement) {
        this.render();
    }
    window.addEventListener('show-qr-scanner', this._handleShowScanner);
  }

  disconnectedCallback(): void {
    this.stopScanner();
    window.removeEventListener('show-qr-scanner', this._handleShowScanner);
  }

  private _handleShowScannerEvent(event: Event): void {
      const customEvent = event as CustomEvent<ShowQrScannerEventDetail>;
      const { taskIndex } = customEvent.detail;
      this.setAttribute('target-task-index', taskIndex.toString());
  }

  render(): void {
    if (this.targetTaskIndex === null) return;

    const task = APP._tasks[this.targetTaskIndex];
    const questName = task ? (task.name || `Quest ${this.targetTaskIndex + 1}`) : 'Unknown Quest';

    const currentMessage = this.errorMessage || 'Waiting for camera access...';
    const isErrorMessage = !!this.errorMessage;

    // Create a wrapper to avoid issues with custom elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
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
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
    
    // Clear and append the wrapper's contents
    this.innerHTML = '';
    while (wrapper.firstChild) {
      this.appendChild(wrapper.firstChild);
    }
    
    this.videoElement = this.querySelector('#scanner-video');

    const cancelButton = this.querySelector('#cancel-button');
    if (cancelButton) {
      cancelButton.addEventListener('click', () => this.dismiss());
    }

    if (!this.errorMessage) {
      this.startScanner();
    }
  }

  async startScanner(): Promise<void> {
    this.stopScanner();
    this.errorMessage = '';

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      this.showMessage('Accessing camera, Sensei...', false);
      
      if (!this.videoElement) {
        throw new Error('Video element not found');
      }
      
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

  stopScanner(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject as MediaStream;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }
  }

  showMessage(message: string, isError: boolean = false): void {
    const msgElement = this.querySelector('#scanner-message');
    if (msgElement) {
      msgElement.textContent = message;
      msgElement.classList.toggle('error-message', isError);
    }
  }

  handleScanResult(scannedData: string | null): void {
    this.stopScanner();

    if (this.targetTaskIndex === null) return;

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
      const detail: QuestCompletedEventDetail = { taskIndex: this.targetTaskIndex };
      window.dispatchEvent(new CustomEvent('quest-completed', { detail }));

      // Trigger confetti animation
      this.triggerConfetti();

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

  triggerConfetti(): void {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 }
    };

    function fire(particleRatio: number, opts: confetti.Options): void {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  }

  dismiss(): void {
    this.stopScanner();
    this.remove();
    window.dispatchEvent(new CustomEvent('scanner-dismissed'));
  }
}

customElements.define('qr-code-scanner', QrCodeScanner);
