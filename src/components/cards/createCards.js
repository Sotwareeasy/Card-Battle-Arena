// createCards.js
// Formulario de creación de una carta nueva. Usa POST vía cardsApi.js.

import { postCard } from '../../api/cardsApi.js';

class CardCreateForm extends HTMLElement {
    constructor() {
        super();
        this.isSaving = false;
        this.errorMessage = '';
        this.render();
        this.configurarEventos();
    }

    render() {
        this.innerHTML = `
            <form class="card-form" novalidate>
                <h3 class="card-form-title">Nueva carta</h3>

                <label class="card-form-label">Nombre
                    <input name="name" type="text" class="card-form-input" required />
                </label>
                <label class="card-form-label">Tipo
                    <input name="type" type="text" class="card-form-input" placeholder="Wizard, Dark Wizard, Creature..." required />
                </label>
                <label class="card-form-label">Imagen (ruta)
                    <input name="image" type="text" class="card-form-input" placeholder="/images/cards/nombre.webp" required />
                </label>
                <label class="card-form-label">Descripción
                    <textarea name="description" class="card-form-input" rows="2" required></textarea>
                </label>

                <fieldset class="card-form-fieldset">
                    <legend>Ataques (daño base)</legend>
                    <label class="card-form-label">Ataque 1 <input name="attack1Name" type="text" class="card-form-input" placeholder="Nombre" required /> <input name="attack1Damage" type="number" class="card-form-input card-form-input--small" value="20" min="1" max="50" required /></label>
                    <label class="card-form-label">Ataque 2 <input name="attack2Name" type="text" class="card-form-input" placeholder="Nombre" required /> <input name="attack2Damage" type="number" class="card-form-input card-form-input--small" value="30" min="1" max="50" required /></label>
                    <label class="card-form-label">Ataque 3 <input name="attack3Name" type="text" class="card-form-input" placeholder="Nombre" required /> <input name="attack3Damage" type="number" class="card-form-input card-form-input--small" value="40" min="1" max="50" required /></label>
                    <label class="card-form-label">Ataque 4 <input name="attack4Name" type="text" class="card-form-input" placeholder="Nombre" required /> <input name="attack4Damage" type="number" class="card-form-input card-form-input--small" value="50" min="1" max="50" required /></label>
                </fieldset>

                <fieldset class="card-form-fieldset">
                    <legend>Defensa</legend>
                    <input name="defenseName" type="text" class="card-form-input" placeholder="Nombre de la defensa" required />
                </fieldset>

                <fieldset class="card-form-fieldset">
                    <legend>Poder especial</legend>
                    <input name="specialName" type="text" class="card-form-input" placeholder="Nombre del poder" required />
                    <label class="card-form-label">Daño (55-70)
                        <input name="specialDamage" type="number" class="card-form-input card-form-input--small" value="60" min="55" max="70" required />
                    </label>
                </fieldset>

                <label class="card-form-label card-form-checkbox">
                    <input name="active" type="checkbox" checked /> Activa
                </label>

                ${this.errorMessage ? `<p class="auth-message auth-message--error">${this.errorMessage}</p>` : ''}

                <div class="card-form-actions">
                    <button type="submit" class="cards-btn cards-btn--primary" ${this.isSaving ? 'disabled' : ''}>
                        ${this.isSaving ? 'Guardando...' : 'Crear carta'}
                    </button>
                    <button type="button" class="cards-btn" data-action="cancel">Cancelar</button>
                </div>
            </form>
        `;
    }

    configurarEventos() {
        this.querySelector('.card-form').addEventListener('submit', (event) => this.handleSubmit(event));
        this.querySelector('[data-action="cancel"]').addEventListener('click', () => {
        this.dispatchEvent(new CustomEvent('cancel-form', { bubbles: true }));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();
        const formData = new FormData(event.target);

        const newCard = {
            id: `card-${Date.now()}`,
            name: formData.get('name').trim(),
            type: formData.get('type').trim(),
            image: formData.get('image').trim(),
            description: formData.get('description').trim(),
            hp: 250,
            attacks: [
                { id: 'attack-01', name: formData.get('attack1Name').trim(), baseDamage: Number(formData.get('attack1Damage')) },
                { id: 'attack-02', name: formData.get('attack2Name').trim(), baseDamage: Number(formData.get('attack2Damage')) },
                { id: 'attack-03', name: formData.get('attack3Name').trim(), baseDamage: Number(formData.get('attack3Damage')) },
                { id: 'attack-04', name: formData.get('attack4Name').trim(), baseDamage: Number(formData.get('attack4Damage')) }
            ],
            defense: { name: formData.get('defenseName').trim(), damageReduction: 0.5 },
            special: {
                name: formData.get('specialName').trim(),
                baseDamage: Number(formData.get('specialDamage')),
                unlockTurn: 2,
                cooldown: 3
            },
            sounds: {
                attack: '/sounds/spell-attack.mp3',
                defense: '/sounds/magic-defense.mp3',
                special: '/sounds/special-spell.mp3',
                defeated: '/sounds/card-defeated.mp3'
            },
            active: formData.get('active') === 'on',
            createdAt: new Date().toISOString()
        };

        this.isSaving = true;
        this.errorMessage = '';
        this.render();
        this.configurarEventos();

        try {
            await postCard(newCard);
            this.dispatchEvent(new CustomEvent('card-created', { bubbles: true }));
        } catch (error) {
            this.isSaving = false;
            this.errorMessage = 'No se pudo crear la carta. Verifica el servidor.';
            this.render();
            this.configurarEventos();
        }
    }
}

customElements.define('card-create-form', CardCreateForm);