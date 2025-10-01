import '../shoelace-setup';

type ModalType = 'info' | 'success' | 'error' | 'warning';

class AppModal extends HTMLElement {
  protected _title: string;
  protected _message: string;
  protected _icon: string;
  protected _type: ModalType;
  protected _autoDismissDelay: number;
  protected _dismissTimeout: number | null;
  private readonly _dismissHandler: () => void;

  constructor() {
    super();
    // Remove Shadow DOM - render directly to light DOM for proper modal behavior
    this._title = 'Notification';
    this._message = 'Something happened!';
    this._icon = 'info-circle';
    this._type = 'info';
    this._autoDismissDelay = 0;
    this._dismissTimeout = null;
    this._dismissHandler = this.dismiss.bind(this);
  }

  static get observedAttributes(): string[] {
    return ['title', 'message', 'icon', 'type', 'auto-dismiss-delay'];
  }

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void {
    if (oldValue === newValue) return;
    
    switch (name) {
      case 'title': 
        this._title = newValue || 'Notification';
        break;
      case 'message': 
        this._message = newValue || 'Something happened!';
        break;
      case 'icon': 
        this._icon = newValue || 'info-circle';
        break;
      case 'type': 
        this._type = (newValue as ModalType) || 'info';
        break;
      case 'auto-dismiss-delay': 
        this._autoDismissDelay = parseInt(newValue || '0', 10);
        break;
    }
  }

  connectedCallback(): void {
    // Perform the initial render of the component's internal HTML structure.
    // This method is guaranteed to run when the element is inserted into the DOM.
    this._renderModalContent();

    // After rendering, now attach event listeners and set timers.
    if (this._autoDismissDelay === 0) {
      const button = this.querySelector('.dismiss-button');
      if (button) {
        button.addEventListener('click', this._dismissHandler);
      }
    }

    if (this._autoDismissDelay > 0) {
      this._dismissTimeout = window.setTimeout(() => {
        this.dismiss();
      }, this._autoDismissDelay);
    }
  }

  disconnectedCallback(): void {
    if (this._dismissTimeout) {
      clearTimeout(this._dismissTimeout);
      this._dismissTimeout = null;
    }
    if (this._autoDismissDelay === 0) {
      const button = this.querySelector('.dismiss-button');
      if (button) {
        button.removeEventListener('click', this._dismissHandler);
      }
    }
  }

  // New method to encapsulate the rendering logic
  private _renderModalContent(): void {
    let iconColor: string;
    let borderColor: string;
    let titleColor: string;
    
    switch (this._type) {
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

    const dismissButtonHTML = this._autoDismissDelay === 0 ? `<sl-button variant="neutral" class="dismiss-button">Dismiss</sl-button>` : '';

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
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 9999; /* Very high z-index to be on top */
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
          margin-bottom: ${this._autoDismissDelay === 0 ? 'var(--sl-spacing-large)' : '0'};
          white-space: pre-wrap; /* Preserve line breaks from message */
          word-break: break-word; /* Ensure long words break */
        }
      </style>
      <div class="modal-overlay">
        <sl-card>
          <sl-icon name="${this._icon}"></sl-icon>
          <h2>${this._title}</h2>
          <p>${this._message}</p>
          ${dismissButtonHTML}
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
    const overlay = this.querySelector('.modal-overlay');
    if (overlay) {
      if (this._dismissTimeout) {
        clearTimeout(this._dismissTimeout);
        this._dismissTimeout = null;
      }

      (overlay as HTMLElement).style.animation = 'fadeOut 0.3s forwards';
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
