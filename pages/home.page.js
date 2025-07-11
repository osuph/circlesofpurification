// pages/home.page.js
class HomePage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Initial render shows loading state if tasks aren't loaded yet.
    this.render();
  }

  connectedCallback() {
    this.shadowRoot.addEventListener('click', this._handleClick.bind(this));
    window.addEventListener('quest-completed', this._handleQuestCompleted.bind(this));
    window.addEventListener('scanner-dismissed', this._handleScannerDismissed.bind(this));
    window.addEventListener('show-qr-scanner', this._handleShowQrScanner.bind(this));
    window.addEventListener('popstate', this.render.bind(this));

    // Listen for the event that signals APP.tasks are loaded
    window.addEventListener('app-tasks-loaded', this._handleAppTasksLoaded.bind(this));

    // If APP.tasks are already loaded (e.g., component re-connected or very fast load),
    // ensure the page renders with the actual data.
    if (APP._tasksLoaded) {
      this.render();
    }
  }

  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this._handleClick.bind(this));
    window.removeEventListener('quest-completed', this._handleQuestCompleted.bind(this));
    window.removeEventListener('scanner-dismissed', this._handleScannerDismissed.bind(this));
    window.removeEventListener('show-qr-scanner', this._handleShowQrScanner.bind(this));
    window.removeEventListener('popstate', this.render.bind(this));

    // Remove the listener when disconnected
    window.removeEventListener('app-tasks-loaded', this._handleAppTasksLoaded.bind(this));
  }

  // New handler for when APP tasks are loaded
  _handleAppTasksLoaded() {
    console.log("Tasks are loaded, rendering home page with quests!");
    this.render();
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

    this.shadowRoot.appendChild(challengeCard);
  }

  _handleShowQrScanner(event) {
    const { taskIndex } = event.detail;
    this._clearModals();

    const qrScanner = document.createElement('qr-code-scanner');
    qrScanner.setAttribute('target-task-index', taskIndex);
    document.body.appendChild(qrScanner);
  }

  _handleQuestCompleted(event) {
    const { taskIndex } = event.detail;
    if (APP.store(taskIndex)) {
      this.render();
      this._clearModals();
    } else {
      alert("Failed to mark quest as complete. An error occurred.");
    }
  }

  _handleScannerDismissed() {
    this._clearModals();
  }

  _clearModals() {
    const existingCard = this.shadowRoot.querySelector('challenge-card');
    if (existingCard) existingCard.remove();
    const existingScanner = document.body.querySelector('qr-code-scanner');
    if (existingScanner) existingScanner.remove();
    const existingSuccessModal = document.body.querySelector('quest-success-modal');
    if (existingSuccessModal) existingSuccessModal.remove();
    const existingFailureModal = document.body.querySelector('quest-failure-modal');
    if (existingFailureModal) existingFailureModal.remove();
  }

  render() {
    // Only update _flags if APP is defined and _flags exists, otherwise default to 0
    // This makes it safer during initial load if APP isn't fully ready, though APP.init() should run first.
    APP._flags = parseInt(localStorage.getItem(TOKEN) || '0', 10);

    // Check if tasks are loaded before trying to access them
    const tasksAreLoaded = APP._tasksLoaded;
    const completedCount = tasksAreLoaded ? APP._tasks.filter((_, index) => FLAGS.get(APP._flags, index)).length : 0;
    const totalTasks = tasksAreLoaded ? APP._tasks.length : 0;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 100vh;
          background-color: var(--sl-color-neutral-50);
          box-sizing: border-box;
          font-family: var(--sl-font-sans);
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
  }
}

customElements.define('home-page', HomePage);
