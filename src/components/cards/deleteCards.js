// deleteCards.js
// Modal de confirmación de eliminación. No llama a la API directamente:
// solo confirma la intención y emite eventos para que cards.js decida qué hacer.

class CardDeleteConfirm extends HTMLElement {
    setCard(card) {
        this.card = card;
        this.render();
        this.configurarEventos();
    }

    render() {
        this.innerHTML = `
            <div class="cards-modal-overlay">
                <div class="cards-modal">
                    <p class="cards-modal-text">¿Eliminar la carta <strong>${this.card.name}</strong>? Esta acción no se puede deshacer.</p>
                    <div class="cards-modal-actions">
                        <button type="button" class="cards-btn cards-btn--danger" data-action="confirm">Eliminar</button>
                        <button type="button" class="cards-btn" data-action="cancel">Cancelar</button>
                    </div>
                </div>
            </div>
        `;
    }

    configurarEventos() {
        this.querySelector('[data-action="confirm"]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('confirm-delete', { detail: { cardId: this.card.id }, bubbles: true }));
        });
        this.querySelector('[data-action="cancel"]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('cancel-delete', { bubbles: true }));
        });
    }
}

customElements.define('card-delete-confirm', CardDeleteConfirm);