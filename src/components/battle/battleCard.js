// battleCard.js
// Web Component que representa UNA carta dentro del combate (jugador o máquina).
// Recibe los datos vía setCard() (no vía atributos, porque el objeto es complejo).

class BattleCard extends HTMLElement {
    constructor() {
        super();
        this.cardData = null;
        this.side = null;
    }

    setCard(cardData, side) {
        this.cardData = cardData;
        this.side = side;
        this.render();
    }

    render() {
        if (!this.cardData) {
            this.innerHTML = '';
            return;
        }

        const hpPercent = Math.max(0, Math.round((this.cardData.currentHp / this.cardData.hp) * 100));
        const cooldownActive = this.cardData.specialCooldown > 0;

        this.innerHTML = `
            <div class="battle-card">
                <img src="${this.cardData.image}" alt="${this.cardData.name}" class="battle-card-image" />
                <h3 class="battle-card-name">${this.cardData.name}</h3>
                <div class="battle-card-hp-bar">
                    <div class="battle-card-hp-fill" style="width: ${hpPercent}%"></div>
                </div>
                <p class="battle-card-hp-text">${this.cardData.currentHp} / ${this.cardData.hp} HP</p>
                <div class="battle-card-badges">
                    ${this.cardData.isDefending ? '<span class="battle-badge battle-badge--defending">🛡 Defendiendo</span>' : ''}
                    ${cooldownActive ? `<span class="battle-badge battle-badge--cooldown">⏳ ${this.cardData.specialCooldown}</span>` : ''}
                </div>
            </div>
        `;
    }

    // Dispara una animación CSS reiniciándola si ya estaba activa.
    triggerAnimation(animationClass) {
        const cardEl = this.querySelector('.battle-card');
        if (!cardEl) return;

        cardEl.classList.remove(animationClass);
        void cardEl.offsetWidth; // fuerza reflow para poder repetir la misma animación
        cardEl.classList.add(animationClass);

        cardEl.addEventListener('animationend', () => {
            cardEl.classList.remove(animationClass);
        }, { once: true });
    }
}

customElements.define('battle-card', BattleCard);