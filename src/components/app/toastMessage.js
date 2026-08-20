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
        document.addEventListener('show-toast', (event) => this.addToast(event.detail));
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