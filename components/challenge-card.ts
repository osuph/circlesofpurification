// components/challenge-card.ts
import '../shoelace-setup';
import type { ShowQrScannerEventDetail } from '../types';

class ChallengeCard extends HTMLElement {
  private readonly _handleDismissClick: () => void;
  private readonly _handleCompleteClick: () => void;

  constructor() {
    super();
    // Remove Shadow DOM - render directly to light DOM for proper modal behavior
    // Don't render in constructor - wait for connectedCallback
    
    // Bind event handlers once to ensure 'this' context is always correct
    this._handleDismissClick = this.dismiss.bind(this);
    this._handleCompleteClick = this._initiateCompletionFromButton.bind(this);
  }

  static get observedAttributes(): string[] {
    return ['task-index', 'quest-name', 'quest-desc', 'is-completed'];
  }

  attributeChangedCallback(): void {
    // Only render if already connected to DOM
    if (this.isConnected) {
      this.render();
      this._attachEventListeners();
    }
  }

  connectedCallback(): void {
    // Render when connected to DOM
    this.render();
    this._attachEventListeners();
  }

  disconnectedCallback(): void {
    // Clean up event listeners to prevent memory leaks when component is removed
    const dismissButton = this.querySelector('sl-button[variant="neutral"]');
    if (dismissButton) {
      dismissButton.removeEventListener('click', this._handleDismissClick);
    }

    const completeButton = this.querySelector('sl-button[variant="primary"]');
    if (completeButton) {
      completeButton.removeEventListener('click', this._handleCompleteClick);
    }
  }

  private _attachEventListeners(): void {
    const dismissButton = this.querySelector('sl-button[variant="neutral"]');
    if (dismissButton) {
      dismissButton.addEventListener('click', this._handleDismissClick);
    }

    const completeButton = this.querySelector('sl-button[variant="primary"]');
    if (completeButton) {
      completeButton.addEventListener('click', this._handleCompleteClick);
    }
  }

  // Helper method to get taskIndex from attributes for the complete button
  private _initiateCompletionFromButton(): void {
    const taskIndex = this.getAttribute('task-index');
    if (taskIndex !== null) {
      this.initiateCompletion(parseInt(taskIndex, 10));
    }
  }

  render(): void {
    const taskIndexStr = this.getAttribute('task-index');
    const taskIndex = taskIndexStr ? parseInt(taskIndexStr, 10) : 0;
    const questName = this.getAttribute('quest-name') || `Quest ${taskIndex + 1}`;
    const questDesc = this.getAttribute('quest-desc') || 'No description provided for this quest.';
    const isCompleted = this.getAttribute('is-completed') === 'true';

    // Create a wrapper to avoid issues with custom elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        sl-card {
          padding: var(--sl-spacing-large);
          width: 90%;
          max-width: 400px;
          text-align: center;
          position: relative;
          background-color: var(--sl-color-neutral-0);
        }

        h2 {
          color: var(--sl-color-primary-700);
          margin-bottom: var(--sl-spacing-medium);
        }

        p {
          color: var(--sl-color-neutral-800);
          margin-bottom: var(--sl-spacing-x-large);
        }

        .button-group {
          display: flex;
          gap: var(--sl-spacing-medium);
          justify-content: center;
          flex-wrap: wrap;
        }

        sl-button {
          flex: 1;
          min-width: 120px;
        }
      </style>
      <div class="modal-overlay">
        <sl-card>
          <h2>Quest Details: ${questName}</h2>
          <p>${questDesc}</p>
          <div class="button-group">
            <sl-button variant="neutral">Dismiss</sl-button>
            ${!isCompleted ? `
              <sl-button variant="primary">Complete Quest</sl-button>
            ` : `
              <sl-button variant="success" disabled>
                <sl-icon name="check" slot="prefix"></sl-icon>
                Already Completed!
              </sl-button>
            `}
          </div>
        </sl-card>
      </div>
    `;
    
    // Clear and append the wrapper's contents
    this.innerHTML = '';
    while (wrapper.firstChild) {
      this.appendChild(wrapper.firstChild);
    }
  }

  dismiss(): void {
    this.remove();
  }

  initiateCompletion(taskIndex: number): void {
    this.remove(); // Dismiss the challenge card
    // Dispatch event for HomePage to manage showing the QR scanner
    const detail: ShowQrScannerEventDetail = { taskIndex };
    window.dispatchEvent(new CustomEvent('show-qr-scanner', { detail }));
  }
}

customElements.define('challenge-card', ChallengeCard);
