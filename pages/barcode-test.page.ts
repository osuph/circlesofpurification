import { detect } from '../app';
import '../shoelace-setup';

class BarcodePage extends HTMLElement {
  constructor() {
    super();
    // Remove Shadow DOM - render directly to light DOM
    
    // Create a wrapper to avoid issues with custom elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <style>
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--sl-spacing-large);
          padding: var(--sl-spacing-x-large);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background-color: var(--sl-color-neutral-50);
          min-height: 100vh;
          box-sizing: border-box;
        }

        h1 {
          color: var(--sl-color-primary-600);
          text-align: center;
        }

        #video-container {
          width: 100%;
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

        sl-button {
          width: 100%;
          max-width: 300px;
        }

        #value {
          color: var(--sl-color-neutral-700);
          font-size: var(--sl-font-size-medium);
          text-align: center;
        }
      </style>
      <div class="container">
        <h1>Barcode Scanner Test Page</h1>
        <p>This page is for testing barcode scanning functionality.</p>
        <div id="video-container">
          <video id="scanner-video" playsinline></video>
        </div>
        <sl-button id="scan" variant="primary">
          <sl-icon name="camera" slot="prefix"></sl-icon> Start Scan
        </sl-button>
        <sl-button id="stop" variant="danger" disabled>
          <sl-icon name="stop-circle" slot="prefix"></sl-icon> Stop Scan
        </sl-button>
        <p id="value">Ready to scan!</p>
      </div>
    `;
    
    // Clear and append the wrapper's contents
    this.innerHTML = '';
    while (wrapper.firstChild) {
      this.appendChild(wrapper.firstChild);
    }

    const video = this.querySelector('#scanner-video') as HTMLVideoElement;
    const scanButton = this.querySelector('#scan') as HTMLButtonElement;
    const stopButton = this.querySelector('#stop') as HTMLButtonElement;
    const value = this.querySelector('#value') as HTMLParagraphElement;

    let abortController: AbortController | null = null;

    const toggleButtons = (scanning: boolean): void => {
      scanButton.disabled = scanning;
      stopButton.disabled = !scanning;
    };

    scanButton.addEventListener('click', async () => {
      toggleButtons(true);
      value.textContent = "Scanning...";

      try {
        abortController = new AbortController();
        const result = await detect(video, abortController.signal);
        if (result) {
          value.textContent = `Result: ${result}`;
        } else {
          value.textContent = "No result detected.";
        }
      } catch (error) {
        console.error("Error during scan:", error);
        value.textContent = "Error during scan. Please try again.";
      } finally {
        toggleButtons(false);
        abortController = null;
      }
    });

    stopButton.addEventListener('click', () => {
      if (abortController) {
        abortController.abort();
        abortController = null;
      }
    });

    if (typeof BarcodeDetector !== 'undefined') {
      BarcodeDetector.getSupportedFormats()
        .then(formats => console.log(`Supported formats: ${formats.join(", ")}`));
    }
  }
}

customElements.define('barcode-test', BarcodePage);
