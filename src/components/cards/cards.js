// cards.js
// Panel administrativo de cartas: orquesta listado, creación, edición,
// eliminación y activación/desactivación. Requiere PATCH para el toggle
// de estado activo (modificación parcial), demostrando su uso explícito.

import { getCards, deleteCard, patchCard } from '../../api/cardsApi.js';
import './createCards.js';
import './editCards.js';
import './deleteCards.js';
import './injectCardsStyles.js';

const STATE = { LOADING: 'loading', ERROR: 'error', READY: 'ready' };
const VIEW = { LIST: 'list', CREATE: 'create', EDIT: 'edit' };

class CardsManager extends HTMLElement {
    constructor() {
        super();
        this.state = STATE.LOADING;
        this.view = VIEW.LIST;
        this.cards = [];
        this.editingCard = null;
        this.pendingDeleteCard = null;
        this.actionError = '';
    }

    connectedCallback() {
        this.loadCards();
    }

    async loadCards() {
        this.state = STATE.LOADING;
        this.render();

        try {
            this.cards = await getCards();
            this.state = STATE.READY;
        } catch (error) {
            this.state = STATE.ERROR;
        }

        this.render();
        this.configurarEventos();
    }

    render() {
        if (this.state === STATE.LOADING) {
            this.innerHTML = `<p class="cards-status">Cargando cartas...</p>`;
            return;
        }

        if (this.state === STATE.ERROR) {
            this.innerHTML = `<p class="cards-status cards-status--error">No se pudieron cargar las cartas. Verifica el servidor.</p>`;
            return;
        }

        if (this.view === VIEW.CREATE) {
            this.innerHTML = `<div class="cards-panel"><card-create-form></card-create-form></div>`;
            return;
        }

        if (this.view === VIEW.EDIT) {
            this.innerHTML = `<div class="cards-panel"><card-edit-form></card-edit-form></div>`;
            const editForm = this.querySelector('card-edit-form');
            editForm.setCard(this.editingCard);
            return;
        }

        this.innerHTML = `
            <div class="cards-panel">
                <div class="cards-panel-header">
                    <h2 class="cards-panel-title">Administrar cartas (${this.cards.length})</h2>
                    <button type="button" class="cards-btn cards-btn--primary" data-action="new-card">+ Nueva carta</button>
                </div>

                ${this.actionError ? `<p class="auth-message auth-message--error">${this.actionError}</p>` : ''}

                <div class="cards-table-wrapper">
                    <table class="cards-table">
                        <thead>
                            <tr>
                                <th></th><th>Nombre</th><th>Tipo</th><th>Estado</th><th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.cards.map((card) => this.renderCardRow(card)).join('')}
                        </tbody>
                    </table>
                </div>

                ${this.pendingDeleteCard ? '<card-delete-confirm></card-delete-confirm>' : ''}
            </div>
        `;

        if (this.pendingDeleteCard) {
            this.querySelector('card-delete-confirm').setCard(this.pendingDeleteCard);
        }
    }

    renderCardRow(card) {
        return `
            <tr class="${card.active ? '' : 'cards-row--inactive'}">
                <td><img src="${card.image}" alt="${card.name}" class="cards-row-thumb" /></td>
                <td>${card.name}</td>
                <td>${card.type}</td>
                <td>${card.active ? '✅ Activa' : '⛔ Inactiva'}</td>
                <td class="cards-row-actions">
                    <button type="button" class="cards-btn cards-btn--small" data-action="edit" data-card-id="${card.id}">Editar</button>
                    <button type="button" class="cards-btn cards-btn--small" data-action="toggle" data-card-id="${card.id}">
                        ${card.active ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" class="cards-btn cards-btn--small cards-btn--danger" data-action="delete" data-card-id="${card.id}">Eliminar</button>
                </td>
            </tr>
        `;
    }

    configurarEventos() {
        const newCardBtn = this.querySelector('[data-action="new-card"]');
        if (newCardBtn) newCardBtn.addEventListener('click', () => this.openCreateView());

        this.querySelectorAll('[data-action="edit"]').forEach((btn) => {
            btn.addEventListener('click', () => this.openEditView(btn.dataset.cardId));
        });

        this.querySelectorAll('[data-action="toggle"]').forEach((btn) => {
            btn.addEventListener('click', () => this.toggleActive(btn.dataset.cardId));
        });

        this.querySelectorAll('[data-action="delete"]').forEach((btn) => {
            btn.addEventListener('click', () => this.openDeleteConfirm(btn.dataset.cardId));
        });

        this.addEventListener('card-created', () => {
            this.backToList();
            this.notify('Carta creada correctamente.', 'success');
        });
        this.addEventListener('card-updated', () => {
            this.backToList();
            this.notify('Carta actualizada correctamente.', 'success');
        });
        this.addEventListener('cancel-form', () => this.backToList());
        this.addEventListener('confirm-delete', (event) => this.confirmDelete(event.detail.cardId));
        this.addEventListener('cancel-delete', () => {
            this.pendingDeleteCard = null;
            this.render();
            this.configurarEventos();
        });
    }

    openCreateView() {
        this.view = VIEW.CREATE;
        this.render();
        this.configurarEventos();
    }

    openEditView(cardId) {
        this.editingCard = this.cards.find((c) => c.id === cardId);
        this.view = VIEW.EDIT;
        this.render();
        this.configurarEventos();
    }

    backToList() {
        this.view = VIEW.LIST;
        this.editingCard = null;
        this.actionError = '';
        this.loadCards();
    }

    async toggleActive(cardId) {
        const card = this.cards.find((c) => c.id === cardId);

        try {
            // PATCH: modificación parcial de un solo campo.
            await patchCard({ active: !card.active }, cardId);
            this.loadCards();
            this.notify(`Carta ${card.active ? 'desactivada' : 'activada'} correctamente.`, 'success');
        } catch (error) {
            this.actionError = 'No se pudo actualizar el estado de la carta.';
            this.render();
            this.configurarEventos();
            this.notify('No se pudo actualizar el estado de la carta.', 'error');
        }
    }

    openDeleteConfirm(cardId) {
        this.pendingDeleteCard = this.cards.find((c) => c.id === cardId);
        this.render();
        this.configurarEventos();
    }

    async confirmDelete(cardId) {
        try {
            await deleteCard(cardId);
            this.pendingDeleteCard = null;
            this.loadCards();
            this.notify('Carta eliminada correctamente.', 'success');
        } catch (error) {
            this.pendingDeleteCard = null;
            this.actionError = 'No se pudo eliminar la carta.';
            this.render();
            this.configurarEventos();
            this.notify('No se pudo eliminar la carta.', 'error');
        }
    }

    notify(message, type) {
        this.dispatchEvent(new CustomEvent('show-toast', {
            detail: { message, type },
            bubbles: true
        }));
    }
}

customElements.define('cards-manager', CardsManager);