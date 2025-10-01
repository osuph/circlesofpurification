import { APP, FLAGS, TOKEN } from '../app.js';
import '../shoelace-setup.js';

class HomePage extends HTMLElement {
  constructor() {
    super();
    // Remove Shadow DOM - render directly to light DOM
    // Don't render in constructor for pages - wait for connectedCallback
    this._qrScannerInstance = null;
    
    // Bind event handlers once to avoid creating new function instances
    this._handleClick = this._handleClickEvent.bind(this);
    this._handleQuestCompleted = this._handleQuestCompletedEvent.bind(this);
    this._handleScannerDismissed = this._handleScannerDismissedEvent.bind(this);
    this._handleShowQrScanner = this._handleShowQrScannerEvent.bind(this);
    this._handlePopState = this.render.bind(this);
    this._handleAppTasksLoaded = this._handleAppTasksLoadedEvent.bind(this);
    this._handleAppModalDismissed = this._handleAppModalDismissedEvent.bind(this);
  }

  connectedCallback() {
    // Initial render shows loading state if tasks aren't loaded yet.
    this.render();
    
    this.addEventListener('click', this._handleClick);
    window.addEventListener('quest-completed', this._handleQuestCompleted);
    window.addEventListener('scanner-dismissed', this._handleScannerDismissed);
    window.addEventListener('show-qr-scanner', this._handleShowQrScanner);
    window.addEventListener('popstate', this._handlePopState);

    // Listen for the event that signals APP.tasks are loaded
    window.addEventListener('app-tasks-loaded', this._handleAppTasksLoaded);
    document.body.addEventListener('app-modal-dismissed', this._handleAppModalDismissed);

    // If APP.tasks are already loaded (e.g., component re-connected or very fast load),
    // ensure the page renders with the actual data.
    if (APP._tasksLoaded) {
      this.render();
    }
  }

  disconnectedCallback() {
    this.removeEventListener('click', this._handleClick);
    window.removeEventListener('quest-completed', this._handleQuestCompleted);
    window.removeEventListener('scanner-dismissed', this._handleScannerDismissed);
    window.removeEventListener('show-qr-scanner', this._handleShowQrScanner);
    window.removeEventListener('popstate', this._handlePopState);

    // Remove the listener when disconnected
    window.removeEventListener('app-tasks-loaded', this._handleAppTasksLoaded);
    document.body.removeEventListener('app-modal-dismissed', this._handleAppModalDismissed);
  }

  // New handler for when APP tasks are loaded
  _handleAppTasksLoadedEvent() {
    console.log("Tasks are loaded, rendering home page with quests!");
    this.render();
  }

  _handleAppModalDismissedEvent() {
      console.log("An AppModal was dismissed.");
      // If a QR scanner is active and an error modal was dismissed manually,
      // we might want to ensure the scanner is also dismissed.
      // This creates a clear flow: user dismisses error modal, then scanner goes away.
      if (this._qrScannerInstance) {
          this._qrScannerInstance.dismiss(); // Call dismiss on the scanner itself
          this._qrScannerInstance = null; // Clear the reference
      }
      this._clearModals(); // Clear any other stray modals (though app-modal removes itself)
  }

  _handleClickEvent(event) {
    const stampItem = event.target.closest('.stamp-item');
    if (stampItem) {
      const taskIndex = parseInt(stampItem.dataset.taskIndex, 10);
      this._showChallengeCard(taskIndex);
    }
  }

  _showChallengeCard(taskIndex) {
    const task = APP._tasks[taskIndex];
    if (!task) {
      console.warn(`WARN: Task at index ${taskIndex} not found!`);
      return;
    }

    this._clearModals();

    const challengeCard = document.createElement('challenge-card');
    challengeCard.setAttribute('task-index', taskIndex);
    challengeCard.setAttribute('quest-name', task.name || `Quest ${taskIndex + 1}`);
    challengeCard.setAttribute('quest-desc', task.desc || 'No description provided.');
    challengeCard.setAttribute('is-completed', FLAGS.get(APP._flags, taskIndex));

    this.appendChild(challengeCard);
  }

  _handleShowQrScannerEvent(event) {
    const { taskIndex } = event.detail;
    this._clearModals();

    // Create and store a reference to the QR scanner
    const qrScanner = document.createElement('qr-code-scanner');
    qrScanner.setAttribute('target-task-index', taskIndex);
    document.body.appendChild(qrScanner);
    this._qrScannerInstance = qrScanner;
  }

  _handleQuestCompletedEvent(event) {
    const { taskIndex } = event.detail;
    if (APP.store(taskIndex)) {
      this.render();
    } else {
      // If storing failed, show an app-modal error
      const errorModal = document.createElement('app-modal');
      errorModal.setAttribute('title', 'Completion Error!');
      errorModal.setAttribute('message', 'Failed to mark quest as complete. An internal error occurred.');
      errorModal.setAttribute('icon', 'x-circle');
      errorModal.setAttribute('type', 'error');
      errorModal.setAttribute('auto-dismiss-delay', '0');
      document.body.appendChild(errorModal);
    }
  }

  _handleScannerDismissedEvent() {
    console.log("QR Scanner dismissed.");
    this._qrScannerInstance = null;
    this._clearModals();
  }

  _clearModals() {
    const existingCard = this.querySelector('challenge-card');
    if (existingCard) existingCard.remove();

    // The qr-code-scanner should manage its own removal via its dismiss() method
    // which is called by the "Cancel Scan" button or after a delayed error.
    // We clear its reference in _handleScannerDismissed.
    // However, if we manually clear here, it ensures cleanup.
    const existingScanner = document.body.querySelector('qr-code-scanner');
    if (existingScanner) existingScanner.remove();

    const existingAppModals = document.body.querySelectorAll('app-modal');
    existingAppModals.forEach(modal => modal.remove());
  }

  render() {
    APP._flags = parseInt(localStorage.getItem(TOKEN) || '0', 10);

    const tasksAreLoaded = APP._tasksLoaded;
    const completedCount = tasksAreLoaded ? APP._tasks.filter((_, index) => FLAGS.get(APP._flags, index)).length : 0;
    const totalTasks = tasksAreLoaded ? APP._tasks.length : 0;

    // Create a wrapper to avoid issues with custom elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background-color: var(--sl-color-neutral-50);
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }

        .container {
          max-width: 600px;
          margin-inline: auto;
          padding: var(--sl-spacing-x-large);
          display: flex;
          flex-direction: column;
          gap: var(--sl-spacing-large);
          align-items: center;
        }

        h1 {
          color: var(--sl-color-primary-600);
          text-align: center;
          margin-bottom: var(--sl-spacing-medium);
        }

        .stamp-status {
          text-align: center;
          margin-bottom: var(--sl-spacing-large);
          font-size: var(--sl-font-size-large);
          color: var(--sl-color-neutral-700);
        }

        .stamp-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 150px));
          gap: var(--sl-spacing-medium);
          width: 100%;
          margin-bottom: var(--sl-spacing-x-large);
          justify-content: center;
        }

        .stamp-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--sl-spacing-medium);
          border: 2px solid var(--sl-color-neutral-300);
          border-radius: var(--sl-border-radius-medium);
          text-align: center;
          font-weight: var(--sl-font-weight-semibold);
          color: var(--sl-color-neutral-700);
          height: 120px;
          box-sizing: border-box;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          cursor: pointer;
          background-color: var(--sl-color-neutral-0);
        }

        .stamp-item:hover:not(.completed) {
            transform: translateY(-2px);
            box-shadow: var(--sl-shadow-medium);
        }

        .stamp-item.completed {
          background-color: var(--sl-color-success-100);
          border-color: var(--sl-color-success-600);
          color: var(--sl-color-success-800);
          cursor: default;
        }

        .stamp-item sl-icon {
          font-size: var(--sl-font-size-x-large);
          margin-bottom: var(--sl-spacing-small);
          color: var(--sl-color-neutral-400);
        }

        .stamp-item.completed sl-icon {
          color: var(--sl-color-success-600);
        }

        sl-button {
          width: 100%;
          max-width: 300px;
        }

        .loading-message {
          text-align: center;
          font-size: var(--sl-font-size-large);
          color: var(--sl-color-primary-500);
          display: flex;
          align-items: center;
          gap: var(--sl-spacing-small);
          margin-top: var(--sl-spacing-x-large);
        }
      </style>
      <div class="container">
        <h1>Welcome! Your Adventure Awaits!</h1>
        ${tasksAreLoaded ? `
          <p class="stamp-status">You have collected <span id="stamps-count">${completedCount}</span> / ${totalTasks} stamps!</p>
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
        ` : `
          <p class="loading-message">Loading quests... <sl-spinner style="font-size: 1.5em;"></p>
        `}
      </div>
    `;
    
    // Clear and append the wrapper's contents
    this.innerHTML = '';
    while (wrapper.firstChild) {
      this.appendChild(wrapper.firstChild);
    }
  }
}

customElements.define('home-page', HomePage);
