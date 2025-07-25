// components/challenge-card.js
class ChallengeCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();

    // Bind event handlers once to ensure 'this' context is always correct
    this._handleDismissClick = this.dismiss.bind(this);
    this._handleCompleteClick = this._initiateCompletionFromButton.bind(this);
  }

  static get observedAttributes() {
    return ['task-index', 'quest-name', 'quest-desc', 'is-completed'];
  }

  attributeChangedCallback() {
    this.render();
    this._attachEventListeners();
  }

  connectedCallback() {
    this._attachEventListeners();
  }

  disconnectedCallback() {
    // Clean up event listeners to prevent memory leaks when component is removed
    const dismissButton = this.shadowRoot.querySelector('sl-button[variant="neutral"]');
    if (dismissButton) {
      dismissButton.removeEventListener('click', this._handleDismissClick);
    }

    const completeButton = this.shadowRoot.querySelector('sl-button[variant="primary"]');
    if (completeButton) {
      completeButton.removeEventListener('click', this._handleCompleteClick);
    }
  }

  _attachEventListeners() {
    const dismissButton = this.shadowRoot.querySelector('sl-button[variant="neutral"]');
    if (dismissButton) {
      dismissButton.addEventListener('click', this._handleDismissClick);
    }

    const completeButton = this.shadowRoot.querySelector('sl-button[variant="primary"]');
    if (completeButton) {
      completeButton.addEventListener('click', this._handleCompleteClick);
    }
  }

  // Helper method to get taskIndex from attributes for the complete button
  _initiateCompletionFromButton() {
    const taskIndex = this.getAttribute('task-index');
    this.initiateCompletion(taskIndex);
  }

  render() {
    const taskIndex = this.getAttribute('task-index');
    const questName = this.getAttribute('quest-name') || `Quest ${parseInt(taskIndex, 10) + 1}`;
    const questDesc = this.getAttribute('quest-desc') || 'No description provided for this quest.';
    const isCompleted = this.getAttribute('is-completed') === 'true';

    this.shadowRoot.innerHTML = `
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
          font-family: var(--sl-font-sans);
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
  }

  dismiss() {
    this.remove();
  }

  initiateCompletion(taskIndex) {
    this.remove(); // Dismiss the challenge card
    // Dispatch event for HomePage to manage showing the QR scanner
    window.dispatchEvent(new CustomEvent('show-qr-scanner', { detail: { taskIndex } }));
  }
}

customElements.define('challenge-card', ChallengeCard);
