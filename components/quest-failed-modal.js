class QuestFailureModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.render();
  }

  connectedCallback() {
    // Automatically dismiss after a few seconds
    setTimeout(() => {
      this.dismiss();
    }, 3000); // Display for 3 seconds
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 3000;
          font-family: var(--sl-font-sans);
          opacity: 0;
          animation: fadeIn 0.3s forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        sl-card {
          padding: var(--sl-spacing-x-large);
          width: 90%;
          max-width: 350px;
          text-align: center;
          background-color: var(--sl-color-neutral-0);
          border-top: 5px solid var(--sl-color-danger-600); /* Red top border */
          transform: translateY(20px);
          animation: slideIn 0.3s forwards;
        }

        @keyframes slideIn {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }

        sl-icon {
          font-size: 4rem;
          color: var(--sl-color-danger-500);
          margin-bottom: var(--sl-spacing-medium);
        }

        h2 {
          color: var(--sl-color-danger-700);
          margin-bottom: var(--sl-spacing-small);
        }

        p {
          color: var(--sl-color-neutral-700);
          font-size: var(--sl-font-size-medium);
        }
      </style>
      <div class="modal-overlay">
        <sl-card>
          <sl-icon name="x-octagon"></sl-icon> <h2>Quest Failed!</h2>
          <p>The QR code did not match. Please try again!</p>
        </sl-card>
      </div>
    `;
  }

  dismiss() {
    // Add a fade out animation before removing
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut 0.3s forwards';
      overlay.addEventListener('animationend', () => {
        this.remove();
      }, { once: true });
    } else {
      this.remove();
    }
  }
}

customElements.define('quest-failure-modal', QuestFailureModal);
