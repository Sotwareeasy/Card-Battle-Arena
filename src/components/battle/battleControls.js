// battleControls.js
// Panel de acciones del jugador: 4 ataques, defensa y poder especial.
// Se deshabilita completamente cuando no es el turno del jugador.

class BattleControls extends HTMLElement {
    constructor() {
        super();
        this.card = null;
        this.actions = null;
        this.enabled = false;
    }

    setControls(card, actions, enabled) {
        this.card = card;
        this.actions = actions;
        this.enabled = enabled;
        this.render();
        this.configurarEventos();
    }

    render() {
        if (!this.card) {
            this.innerHTML = '';
            return;
        }

        const disabledAttr = this.enabled ? '' : 'disabled';
        const specialLocked = !this.actions.canUseSpecial;

        this.innerHTML = `
            <div class="battle-controls ${this.enabled ? '' : 'battle-controls--disabled'}">
                <div class="battle-controls-attacks">
                    ${this.card.attacks.map((attack) => `
                        <button type="button" class="battle-action-btn" data-action="attack" data-attack-id="${attack.id}" ${disabledAttr}>
                            ${attack.name} <span class="battle-action-power">(${attack.baseDamage})</span>
                        </button>
                    `).join('')}
                </div>
                <div class="battle-controls-secondary">
                    <button type="button" class="battle-action-btn battle-action-btn--defense" data-action="defense" ${disabledAttr}>
                        🛡 ${this.card.defense.name}
                    </button>
                    <button type="button" class="battle-action-btn battle-action-btn--special" data-action="special" ${disabledAttr || specialLocked ? 'disabled' : ''}>
                        ✨ ${this.card.special.name}
                        ${specialLocked ? `<span class="battle-action-lock">${this.card.specialCooldown > 0 ? `⏳${this.card.specialCooldown}` : '🔒'}</span>` : ''}
                    </button>
                </div>
            </div>
        `;
    }

    configurarEventos() {
        this.querySelectorAll('.battle-action-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const action = btn.dataset.action;

                if (action === 'attack') {
                    this.dispatchEvent(new CustomEvent('action-attack', {
                        detail: { attackId: btn.dataset.attackId },
                        bubbles: true
                    }));
                } else if (action === 'defense') {
                    this.dispatchEvent(new CustomEvent('action-defense', { bubbles: true }));
                } else if (action === 'special') {
                    this.dispatchEvent(new CustomEvent('action-special', { bubbles: true }));
                }
            });
        });
    }
}

customElements.define('battle-controls', BattleControls);