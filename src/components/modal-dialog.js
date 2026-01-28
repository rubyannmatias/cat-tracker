class ModalDialog extends HTMLElement {
  constructor() {
    super();
    this.resolve = null;
  }

  connectedCallback() {
    this.render();
  }

  /**
   * Show an alert modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @returns {Promise<void>}
   */
  showAlert(title, message) {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.renderAlert(title, message);
    });
  }

  /**
   * Show a confirmation modal
   * @param {string} title - Modal title
   * @param {string} message - Modal message
   * @param {Object} options - Options for confirm/cancel buttons
   * @returns {Promise<boolean>}
   */
  showConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.renderConfirm(title, message, options);
    });
  }

  renderAlert(title, message) {
    this.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
      ">
        <div class="modal-content" style="
          background: var(--surface);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.2s ease-out;
        ">
          <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.25rem;">
            ${title}
          </h3>
          <p style="margin: 0 0 1.5rem 0; color: var(--text-secondary); line-height: 1.5; white-space: pre-line;">
            ${message}
          </p>
          <div style="display: flex; justify-content: flex-end;">
            <button class="btn btn-primary modal-ok-btn" style="min-width: 100px;">
              OK
            </button>
          </div>
        </div>
      </div>
    `;

    this.querySelector('.modal-ok-btn').addEventListener('click', () => {
      this.close(true);
    });

    this.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.close(true);
      }
    });
  }

  renderConfirm(title, message, options = {}) {
    const confirmText = options.confirmText || 'Confirm';
    const cancelText = options.cancelText || 'Cancel';
    const confirmStyle = options.danger ? 'background: var(--error); border-color: var(--error);' : '';

    this.innerHTML = `
      <div class="modal-overlay" style="
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 1rem;
      ">
        <div class="modal-content" style="
          background: var(--surface);
          border-radius: 1rem;
          padding: 2rem;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: modalSlideIn 0.2s ease-out;
        ">
          <h3 style="margin: 0 0 1rem 0; color: var(--text-primary); font-size: 1.25rem;">
            ${title}
          </h3>
          <p style="margin: 0 0 1.5rem 0; color: var(--text-secondary); line-height: 1.5; white-space: pre-line;">
            ${message}
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: flex-end;">
            <button class="btn btn-outline modal-cancel-btn" style="min-width: 100px;">
              ${cancelText}
            </button>
            <button class="btn btn-primary modal-confirm-btn" style="min-width: 100px; ${confirmStyle}">
              ${confirmText}
            </button>
          </div>
        </div>
      </div>
    `;

    this.querySelector('.modal-confirm-btn').addEventListener('click', () => {
      this.close(true);
    });

    this.querySelector('.modal-cancel-btn').addEventListener('click', () => {
      this.close(false);
    });

    this.querySelector('.modal-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay')) {
        this.close(false);
      }
    });
  }

  close(result) {
    if (this.resolve) {
      this.resolve(result);
      this.resolve = null;
    }
    this.innerHTML = '';
  }

  render() {
    this.innerHTML = '';
  }
}

customElements.define('modal-dialog', ModalDialog);

export default ModalDialog;
