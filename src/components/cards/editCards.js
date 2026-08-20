// editCards.js
// Formulario de edición de una carta existente. Usa PUT (reemplazo completo)
// vía cardsApi.js, demostrando explícitamente el uso de PUT exigido por la rúbrica.

import { putCard } from '../../api/cardsApi.js';

class CardEditForm extends HTMLElement {
    setCard(card) {
        this.card = card;
        this.isSaving = false;
        this.errorMessage = '';
        this.render();
        this.configurarEventos();
    }

    render() {
        const c = this.card;

        this.innerHTML = `
            <form class="card-form" novalidate>
                <h3 class="card-form-title">Editar: ${c.name}</h3>

                <label class="card-form-label">Nombre
                    <input name="name" type="text" class="card-form-input" value="${c.name}" required />
                </label>
                <label class="card-form-label">Tipo
                    <input name="type" type="text" class="card-form-input" value="${c.type}" required />
                </label>
                <label class="card-form-label">Imagen (ruta)
                    <input name="image" type="text" class="card-form-input" value="${c.image}" required />
                </label>
                <label class="card-form-label">Descripción
                    <textarea name="description" class="card-form-input" rows="2" required>${c.description}</textarea>
                </label>

                <fieldset class="card-form-fieldset">
                    <legend>Ataques (daño base)</legend>
                    ${c.attacks.map((atk, i) => `
                        <label class="card-form-label">Ataque ${i + 1}
                            <input name="attack${i + 1}Name" type="text" class="card-form-input" value="${atk.name}" required />
                            <input name="attack${i + 1}Damage" type="number" class="card-form-input card-form-input--small" value="${atk.baseDamage}" min="1" max="50" required />
                        </label>
                    `).join('')}
                </fieldset>

                <fieldset class="card-form-fieldset">
                    <legend>Defensa</legend>
                    <input name="defenseName" type="text" class="card-form-input" value="${c.defense.name}" required />
                </fieldset>

                <fieldset class="card-form-fieldset">
                    <legend>Poder especial</legend>
                    <input name="specialName" type="text" class="card-form-input" value="${c.special.name}" required />
                    <label class="card-form-label">Daño (55-70)
                        <input name="specialDamage" type="number" class="card-form-input card-form-input--small" value="${c.special.baseDamage}" min="55" max="70" required />
                    </label>
                </fieldset>

                <label class="card-form-label card-form-checkbox">
                    <input name="active" type="checkbox" ${c.active ? 'checked' : ''} /> Activa
                </label>

                ${this.errorMessage ? `<p class="auth-message auth-message--error">${this.errorMessage}</p>` : ''}

                <div class="card-form-actions">
                    <button type="submit" class="cards-btn cards-btn--primary" ${this.isSaving ? 'disabled' : ''}>
                        ${this.isSaving ? 'Guardando...' : 'Guardar cambios'}
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

        // PUT reemplaza el recurso COMPLETO: reconstruimos el objeto entero,
        // conservando id, hp, sounds y createdAt originales.
        const updatedCard = {
            ...this.card,
            name: formData.get('name').trim(),
            type: formData.get('type').trim(),
            image: formData.get('image').trim(),
            description: formData.get('description').trim(),
            attacks: this.card.attacks.map((atk, i) => ({
                id: atk.id,
                name: formData.get(`attack${i + 1}Name`).trim(),
                baseDamage: Number(formData.get(`attack${i + 1}Damage`))
            })),
            defense: { name: formData.get('defenseName').trim(), damageReduction: 0.5 },
            special: {
                ...this.card.special,
                name: formData.get('specialName').trim(),
                baseDamage: Number(formData.get('specialDamage'))
            },
            active: formData.get('active') === 'on'
        };

        this.isSaving = true;
        this.errorMessage = '';
        this.render();
        this.configurarEventos();

        try {
            await putCard(updatedCard, this.card.id);
            this.dispatchEvent(new CustomEvent('card-updated', { bubbles: true }));
        } catch (error) {
            this.isSaving = false;
            this.errorMessage = 'No se pudo guardar la carta. Verifica el servidor.';
            this.render();
            this.configurarEventos();
        }
    }
}

customElements.define('card-edit-form', CardEditForm);