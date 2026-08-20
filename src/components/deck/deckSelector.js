// deckSelector.js
// Web Component para la selección del mazo del jugador (5 cartas, sin repetir, con orden).
// Al confirmar, arma también el mazo de la máquina y emite el evento 'deck-selected'.

import { getCards } from '../../api/cardsApi.js';
import { pickRandomCards } from '../../utils/random.js';
import './injectDeckStyles.js';

const REQUIRED_DECK_SIZE = 5;
const MIN_ACTIVE_CARDS_TO_PLAY = 10;

const STATE = {
    LOADING: 'loading',
    ERROR: 'error',
    READY: 'ready'
};

class DeckSelector extends HTMLElement {
    constructor() {
        super();
        this.state = STATE.LOADING;
        this.errorMessage = '';
        this.allCards = [];
        this.selectedCards = []; // orden = orden de batalla
    }

    connectedCallback() {
        this.loadCards();
    }

    async loadCards() {
        try {
            const cards = await getCards();
            this.allCards = cards.filter((card) => card.active);
            this.state = STATE.READY;
        } catch (error) {
            this.errorMessage = 'No se pudieron cargar las cartas. Verifica que el servidor esté activo.';
            this.state = STATE.ERROR;
        }
        this.render();
        this.configurarEventos();
    }

    render() {
        if (this.state === STATE.LOADING) {
            this.innerHTML = `<p class="deck-status">Cargando cartas...</p>`;
            return;
        }

        if (this.state === STATE.ERROR) {
            this.innerHTML = `<p class="deck-status deck-status--error">${this.errorMessage}</p>`;
            return;
        }

        if (this.allCards.length < MIN_ACTIVE_CARDS_TO_PLAY) {
            this.innerHTML = `
                <p class="deck-status deck-status--error">
                    Se necesitan al menos ${MIN_ACTIVE_CARDS_TO_PLAY} cartas activas para jugar.
                    Actualmente hay ${this.allCards.length}.
                </p>
            `;
            return;
        }

        this.innerHTML = `
            <section class="deck-selector">
                <h2 class="deck-title">Elige tu mazo (${this.selectedCards.length}/${REQUIRED_DECK_SIZE})</h2>

                <div class="deck-grid">
                    ${this.allCards.map((card) => this.renderCardTile(card)).join('')}
                </div>

                ${this.selectedCards.length > 0 ? this.renderOrderPanel() : ''}

                <button
                    class="deck-confirm-button"
                    ${this.selectedCards.length === REQUIRED_DECK_SIZE ? '' : 'disabled'}
                >
                    Confirmar mazo e iniciar batalla
                </button>
            </section>
        `;
    }

    renderCardTile(card) {
        const isSelected = this.selectedCards.some((c) => c.id === card.id);
        const isDisabled = !isSelected && this.selectedCards.length >= REQUIRED_DECK_SIZE;

        return `
            <button
                type="button"
                class="deck-tile ${isSelected ? 'deck-tile--selected' : ''}"
                data-card-id="${card.id}"
                ${isDisabled ? 'disabled' : ''}
            >
                <img src="${card.image}" alt="${card.name}" class="deck-tile-image" />
                <span class="deck-tile-name">${card.name}</span>
                <span class="deck-tile-type">${card.type}</span>
            </button>
        `;
    }

    renderOrderPanel() {
        return `
            <div class="deck-order-panel">
                <h3 class="deck-order-title">Orden de batalla</h3>
                <ol class="deck-order-list">
                    ${this.selectedCards.map((card, index) => `
                        <li class="deck-order-item">
                            <span>${index + 1}. ${card.name}</span>
                            <span class="deck-order-controls">
                                <button type="button" class="deck-order-btn" data-move="up" data-card-id="${card.id}" ${index === 0 ? 'disabled' : ''}>▲</button>
                                <button type="button" class="deck-order-btn" data-move="down" data-card-id="${card.id}" ${index === this.selectedCards.length - 1 ? 'disabled' : ''}>▼</button>
                            </span>
                        </li>
                    `).join('')}
                </ol>
            </div>
        `;
    }

    configurarEventos() {
        this.querySelectorAll('.deck-tile').forEach((tile) => {
            tile.addEventListener('click', () => this.toggleCardSelection(tile.dataset.cardId));
        });

        this.querySelectorAll('.deck-order-btn').forEach((btn) => {
            btn.addEventListener('click', () => this.moveCard(btn.dataset.cardId, btn.dataset.move));
        });

        const confirmButton = this.querySelector('.deck-confirm-button');
        if (confirmButton) {
            confirmButton.addEventListener('click', () => this.confirmDeck());
        }
    }

    toggleCardSelection(cardId) {
        const alreadySelected = this.selectedCards.some((c) => c.id === cardId);

        if (alreadySelected) {
            this.selectedCards = this.selectedCards.filter((c) => c.id !== cardId);
        } else {
            if (this.selectedCards.length >= REQUIRED_DECK_SIZE) return;
            const card = this.allCards.find((c) => c.id === cardId);
            this.selectedCards.push(card);
        }

        this.render();
        this.configurarEventos();
    }

    moveCard(cardId, direction) {
        const index = this.selectedCards.findIndex((c) => c.id === cardId);
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= this.selectedCards.length) return;

        [this.selectedCards[index], this.selectedCards[targetIndex]] =
            [this.selectedCards[targetIndex], this.selectedCards[index]];

        this.render();
        this.configurarEventos();
    }

    confirmDeck() {
        if (this.selectedCards.length !== REQUIRED_DECK_SIZE) return;

        const playerCardIds = this.selectedCards.map((c) => c.id);
        const machineDeck = pickRandomCards(this.allCards, REQUIRED_DECK_SIZE, playerCardIds);

        this.dispatchEvent(new CustomEvent('deck-selected', {
            detail: {
                playerDeck: this.selectedCards,
                machineDeck
            },
            bubbles: true
        }));
    }
}

customElements.define('deck-selector', DeckSelector);