// toastMessage.js
// Sistema global de notificaciones flotantes (toast).
// Cualquier componente puede disparar una notificación emitiendo un evento
// 'show-toast' que burbujea hasta <toast-stack>, sin acoplarse directamente a él.
//
// Uso desde cualquier componente:
//   this.dispatchEvent(new CustomEvent('show-toast', {
//       detail: { message: 'Carta creada', type: 'success' },
//       bubbles: true
//   }));

class ToastStack extends HTMLElement {
    constructor() {
        super();
        this.innerHTML = '';
        this.className = 'toast-stack';
        this._toastHandler = (event) => this.addToast(event.detail);
    }

    connectedCallback() {
        document.addEventListener('show-toast', this._toastHandler);
    }

    disconnectedCallback() {
        document.removeEventListener('show-toast', this._toastHandler);
    }

    addToast({ message, type = 'success' }) {
        const toastEl = document.createElement('div');
        toastEl.className = `toast toast--${type}`;
        toastEl.textContent = message;
        this.appendChild(toastEl);

        setTimeout(() => toastEl.remove(), 3000);
    }
}

customElements.define('toast-stack', ToastStack);