import { detect } from '../app.js';
import '../shoelace-setup.js';

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
        <sl-button id="stop" variant="neutral" disabled>
          <sl-icon name="stop-circle" slot="prefix"></sl-icon> Stop Scan
        </sl-button>
        <div id="value"></div>
      </div>
    `;
    
    // Clear and append the wrapper's contents
    while (wrapper.firstChild) {
      this.appendChild(wrapper.firstChild);
    }

    const scanButton = this.querySelector("#scan");
    const stopButton = this.querySelector("#stop");
    const video = this.querySelector("#scanner-video");
    const value = this.querySelector("#value");

    let abortController = null;

    const toggleButtons = (isScanning) => {
      stopButton.disabled = !isScanning;
      scanButton.disabled = isScanning;
    };

    toggleButtons(false);

    scanButton.addEventListener('click', async () => {
      abortController = new AbortController();
      abortController.signal.addEventListener('abort', () => {
        toggleButtons(false);
      });

      toggleButtons(true);

      try {
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
