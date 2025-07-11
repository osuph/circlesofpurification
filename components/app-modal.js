// components/app-modal.js (Revised for clearer rendering & event handling)
class AppModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    // Default values, will be overridden by attributes
    this.title = 'Notification';
    this.message = 'Something happened!';
    this.icon = 'info-circle';
    this.type = 'info';
    this.autoDismissDelay = 0;
    this.dismissTimeout = null;
  }

  static get observedAttributes() {
    return ['title', 'message', 'icon', 'type', 'auto-dismiss-delay'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Update internal properties. The initial render in connectedCallback
    // will use these, and subsequent attribute changes for this specific component
    // are less likely to require a full re-render of the static template.
    switch (name) {
      case 'title': this.title = newValue; break;
      case 'message': this.message = newValue; break;
      case 'icon': this.icon = newValue; break;
      case 'type': this.type = newValue; break;
      case 'auto-dismiss-delay': this.autoDismissDelay = parseInt(newValue, 10); break;
    }
    // Crucial: Do NOT call this.render() here.
    // Calling render() repeatedly or before the element is in the DOM
    // can cause issues with event listeners and element existence.
    // The initial render is handled by connectedCallback.
  }

  connectedCallback() {
    // Perform the initial render of the component's internal HTML structure.
    // This method is guaranteed to run when the element is inserted into the DOM.
    this._renderModalContent(); // Renamed to clearly indicate it renders the content.

    // After rendering, now attach event listeners and set timers.
    if (this.autoDismissDelay === 0) {
      const button = this.shadowRoot.querySelector('.dismiss-button');
      if (button) {
        button.addEventListener('click', this.dismiss.bind(this));
      }
    }

    if (this.autoDismissDelay > 0) {
      this.dismissTimeout = setTimeout(() => {
        this.dismiss();
      }, this.autoDismissDelay);
    }
  }

  disconnectedCallback() {
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }
    if (this.autoDismissDelay === 0) {
      const button = this.shadowRoot.querySelector('.dismiss-button');
      if (button) {
        button.removeEventListener('click', this.dismiss.bind(this));
      }
    }
  }

  // New method to encapsulate the rendering logic
  _renderModalContent() {
    let iconColor, borderColor, titleColor;
    switch (this.type) {
      case 'success':
        iconColor = 'var(--sl-color-success-500)';
        borderColor = 'var(--sl-color-success-600)';
        titleColor = 'var(--sl-color-success-700)';
        break;
      case 'error':
        iconColor = 'var(--sl-color-danger-500)';
        borderColor = 'var(--sl-color-danger-600)';
        titleColor = 'var(--sl-color-danger-700)';
        break;
      case 'warning':
        iconColor = 'var(--sl-color-warning-500)';
        borderColor = 'var(--sl-color-warning-600)';
        titleColor = 'var(--sl-color-warning-700)';
        break;
      default: // 'info' or any other
        iconColor = 'var(--sl-color-info-500)';
        borderColor = 'var(--sl-color-info-600)';
        titleColor = 'var(--sl-color-info-700)';
        break;
    }

    const dismissButtonHTML = this.autoDismissDelay === 0 ? `<sl-button variant="neutral" class="dismiss-button">Dismiss</sl-button>` : '';

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
          z-index: 9999; /* Very high z-index to be on top */
          font-family: var(--sl-font-sans);
          opacity: 0;
          animation: fadeIn 0.3s forwards;
          backdrop-filter: blur(3px); /* Add a subtle blur to the background */
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
          border-top: 5px solid ${borderColor};
          animation: slideIn 0.3s forwards cubic-bezier(0.25, 0.46, 0.45, 0.94); /* Added cubic-bezier for smoother animation */
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: var(--sl-shadow-2x-large); /* More prominent shadow */
          border-radius: var(--sl-border-radius-large); /* Match Shoelace cards */
        }

        @keyframes slideIn {
            from { transform: translateY(50px); opacity: 0; } /* Increased initial Y for more noticeable slide */
            to { transform: translateY(0); opacity: 1; }
        }

        sl-icon {
          font-size: 4rem;
          color: ${iconColor};
          margin-bottom: var(--sl-spacing-medium);
        }

        h2 {
          color: ${titleColor};
          margin-bottom: var(--sl-spacing-small);
        }

        p {
          color: var(--sl-color-neutral-700);
          font-size: var(--sl-font-size-medium);
          margin-bottom: ${this.autoDismissDelay === 0 ? 'var(--sl-spacing-large)' : '0'};
          white-space: pre-wrap; /* Preserve line breaks from message */
          word-break: break-word; /* Ensure long words break */
        }
      </style>
      <div class="modal-overlay">
        <sl-card>
          <sl-icon name="${this.icon}"></sl-icon>
          <h2>${this.title}</h2>
          <p>${this.message}</p>
          ${dismissButtonHTML}
        </sl-card>
      </div>
    `;
  }

  dismiss() {
    const overlay = this.shadowRoot.querySelector('.modal-overlay');
    if (overlay) {
      if (this.dismissTimeout) {
        clearTimeout(this.dismissTimeout);
        this.dismissTimeout = null;
      }

      overlay.style.animation = 'fadeOut 0.3s forwards';
      overlay.addEventListener('animationend', () => {
        this.remove();
        this.dispatchEvent(new CustomEvent('app-modal-dismissed', {
            bubbles: true,
            composed: true
        }));
      }, { once: true });
    } else {
      this.remove();
      this.dispatchEvent(new CustomEvent('app-modal-dismissed', { bubbles: true, composed: true }));
    }
  }
}

customElements.define('app-modal', AppModal);
