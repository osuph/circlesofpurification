class HomePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._handleClick.bind(this));
    window.addEventListener('quest-completed', this._handleQuestCompleted.bind(this));
    window.addEventListener('scanner-dismissed', this._handleScannerDismissed.bind(this));
    window.addEventListener('popstate', this.render.bind(this));
    window.addEventListener('show-qr-scanner', this._handleShowQrScanner.bind(this));
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleClick.bind(this));
    window.removeEventListener('quest-completed', this._handleQuestCompleted.bind(this));
    window.removeEventListener('scanner-dismissed', this._handleScannerDismissed.bind(this));
    window.removeEventListener('popstate', this.render.bind(this));
    // FIX: Remove listener for the 'show-qr-scanner' event
    window.removeEventListener('show-qr-scanner', this._handleShowQrScanner.bind(this));
  }

  _handleClick(event) {
    const stampItem = event.target.closest('.stamp-item');
    if (stampItem) {
      const taskIndex = parseInt(stampItem.dataset.taskIndex, 10);
      this._showChallengeCard(taskIndex);
    }
  }

  _showChallengeCard(taskIndex) {
    const task = APP._tasks[taskIndex];
    if (!task) return;

    this._clearModals(); // Clear any existing modals before showing a new challenge card

    const challengeCard = document.createElement('challenge-card');
    challengeCard.setAttribute('task-index', taskIndex);
    challengeCard.setAttribute('quest-name', task.name || `Quest ${taskIndex + 1}`);
    challengeCard.setAttribute('quest-desc', task.desc || 'No description provided.');
    challengeCard.setAttribute('is-completed', FLAGS.get(APP._flags, taskIndex));

    this.shadowRoot.appendChild(challengeCard); // Append challenge card to home page's shadow DOM
  }

  // FIX: New handler to display the QR scanner
  _handleShowQrScanner(event) {
    const { taskIndex } = event.detail;
    this._clearModals(); // Clear any other modals (like the challenge card) before showing scanner

    const qrScanner = document.createElement('qr-code-scanner');
    qrScanner.setAttribute('target-task-index', taskIndex);
    document.body.appendChild(qrScanner); // Append the QR scanner to the document body
  }


  _handleQuestCompleted(event) {
    const { taskIndex } = event.detail;
    if (APP.store(taskIndex)) {
      this.render(); // Re-render the home page to update stamp status
      this._clearModals(); // Ensure all modals are cleared
      // The success modal is now displayed by the qr-code-scanner component itself,
      // so we don't need an alert() here.
    } else {
        alert("Failed to mark quest as complete. An error occurred, Sensei!");
    }
  }

  _handleScannerDismissed() {
    this._clearModals(); // Clear modals/scanners if dismissed from within the scanner itself
  }

  _clearModals() {
    // Clear existing challenge card (if any) that might be in HomePage's shadow DOM
    const existingCard = this.shadowRoot.querySelector('challenge-card');
    if (existingCard) existingCard.remove();

    // FIX: Clear existing scanner or success/failure modals that are appended to document.body
    const existingScanner = document.body.querySelector('qr-code-scanner');
    if (existingScanner) existingScanner.remove();
    const existingSuccessModal = document.body.querySelector('quest-success-modal');
    if (existingSuccessModal) existingSuccessModal.remove();
    const existingFailureModal = document.body.querySelector('quest-failure-modal');
    if (existingFailureModal) existingFailureModal.remove();
  }

  render() {
    APP._flags = parseInt(localStorage.getItem(TOKEN) || '0', 10);
    const completedCount = APP._tasks.filter((_, index) => FLAGS.get(APP._flags, index)).length;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background-color: var(--sl-color-neutral-50); /* Using Shoelace neutral background */
          box-sizing: border-box;
          font-family: var(--sl-font-sans); /* Use Shoelace's default font */
        }

        .container { /* Renamed from wa-container for clarity, but same purpose */
          max-width: 600px;
          margin-inline: auto;
          padding: var(--sl-spacing-x-large); /* Shoelace spacing variable */
          display: flex;
          flex-direction: column;
          gap: var(--sl-spacing-large); /* Shoelace spacing variable */
          align-items: center;
        }

        h1 {
          color: var(--sl-color-primary-600); /* Shoelace primary color */
          text-align: center;
          margin-bottom: var(--sl-spacing-medium); /* Shoelace spacing */
        }

        .stamp-status {
          text-align: center;
          margin-bottom: var(--sl-spacing-large);
          font-size: var(--sl-font-size-large); /* Shoelace font size */
          color: var(--sl-color-neutral-700);
        }

        .stamp-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--sl-spacing-medium);
          width: 100%;
          margin-bottom: var(--sl-spacing-x-large);
        }

        .stamp-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--sl-spacing-medium);
          border: 2px solid var(--sl-color-neutral-300);
          border-radius: var(--sl-border-radius-medium); /* Shoelace border radius */
          text-align: center;
          font-weight: var(--sl-font-weight-semibold); /* Shoelace font weight */
          color: var(--sl-color-neutral-700);
          height: 120px;
          box-sizing: border-box;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          cursor: pointer;
          background-color: var(--sl-color-neutral-0); /* White background for stamps */
        }

        .stamp-item:hover:not(.completed) {
            transform: translateY(-2px);
            box-shadow: var(--sl-shadow-medium); /* Shoelace shadow */
        }

        .stamp-item.completed {
          background-color: var(--sl-color-success-100);
          border-color: var(--sl-color-success-600);
          color: var(--sl-color-success-800);
          cursor: default;
        }

        .stamp-item sl-icon { /* Changed from wa-icon */
          font-size: var(--sl-font-size-x-large); /* Shoelace font size */
          margin-bottom: var(--sl-spacing-small);
          color: var(--sl-color-neutral-400);
        }

        .stamp-item.completed sl-icon { /* Changed from wa-icon */
          color: var(--sl-color-success-600);
        }

        sl-button { /* Changed from wa-button */
          width: 100%;
          max-width: 300px;
          /* Shoelace buttons handle their own sizing and padding well */
        }
      </style>
      <div class="container">
        <h1>Welcome! Your Adventure Awaits!</h1>
        <p class="stamp-status">You have collected <span id="stamps-count">${completedCount}</span> / ${APP._tasks.length} stamps!</p>

        <div class="stamp-card-grid" id="stamp-grid">
          ${APP._tasks.map((task, index) => {
            const isCompleted = FLAGS.get(APP._flags, index);
            return `
              <div class="stamp-item ${isCompleted ? 'completed' : ''}" data-task-index="${index}">
                <sl-icon name="${isCompleted ? 'check-circle' : 'circle-notch'}"></sl-icon> <span>${task.name || `Quest ${index + 1}`}</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
}

customElements.define('home-page', HomePage);
