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

    // Muestra un mensaje flotante (¡GOLPE CRÍTICO! / ¡ATAQUE ESQUIVADO!) sobre la carta.
    // type: 'critical' | 'dodge' -> usa las clases .battle-feedback--critical / --dodge ya definidas en battleStyles.css
    showFeedback(text, type) {
        const cardEl = this.querySelector('.battle-card');
        if (!cardEl) return;

        // Si ya había un mensaje flotante en curso, se retira antes de mostrar el nuevo
        const previous = cardEl.querySelector('.battle-feedback');
        if (previous) previous.remove();

        const feedbackEl = document.createElement('span');
        feedbackEl.className = `battle-feedback battle-feedback--${type}`;
        feedbackEl.textContent = text;
        cardEl.appendChild(feedbackEl);

        feedbackEl.addEventListener('animationend', () => {
            feedbackEl.remove();
        }, { once: true });
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