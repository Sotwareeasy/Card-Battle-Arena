// battle.js
// Orquestador de la pantalla de combate. Conecta battleEngine.js (lógica pura)
// con battle-card y battle-controls (UI), maneja animaciones y sonido.
//
// Recibe el mazo del jugador y de la máquina mediante propiedades JS
// (this.playerDeck / this.machineDeck), asignadas por gameApp.js ANTES
// de insertar el elemento en el DOM.

import * as engine from '../../utils/battleEngine.js';
import { decideMachineAction } from '../../utils/machineAI.js';
import './battleCard.js';
import './battleControls.js';
import './injectBattleStyles.js';

const MACHINE_TURN_DELAY_MS = 1200;
const DEFEAT_TRANSITION_MS = 900;

class BattleArena extends HTMLElement {
    constructor() {
        super();
        this.playerDeck = null;
        this.machineDeck = null;
        this.state = null;
        this.previousLogLength = 0;
        this.startedAt = null;
    }

    connectedCallback() {
        this.startedAt = new Date().toISOString();
        this.state = engine.createInitialBattleState(this.playerDeck, this.machineDeck);
        this.render();
        this.configurarEventos();
        this.syncUI();

        if (this.state.turn === 'machine') {
            this.scheduleMachineTurn();
        }
    }

    render() {
        this.innerHTML = `
            <section class="battle-arena">
                <p class="battle-turn-indicator"></p>
                <div class="battle-field">
                    <battle-card class="battle-side battle-side--player"></battle-card>
                    <span class="battle-vs">VS</span>
                    <battle-card class="battle-side battle-side--machine"></battle-card>
                </div>
                <battle-controls></battle-controls>
            </section>
        `;
    }

    configurarEventos() {
        this.addEventListener('action-attack', (event) => {
            if (!this.isPlayerTurn()) return;
            engine.performAttack(this.state, 'player', event.detail.attackId);
            this.handleStateChange();
        });

        this.addEventListener('action-defense', () => {
            if (!this.isPlayerTurn()) return;
            engine.performDefense(this.state, 'player');
            this.handleStateChange();
        });

        this.addEventListener('action-special', () => {
            if (!this.isPlayerTurn()) return;
            engine.performSpecial(this.state, 'player');
            this.handleStateChange();
        });
    }

    isPlayerTurn() {
        return this.state.turn === 'player' && this.state.status === engine.BATTLE_STATUS.IN_PROGRESS;
    }

    // --- Flujo tras cualquier acción (jugador o máquina) ---

    handleStateChange() {
        const newEntries = this.state.log.slice(this.previousLogLength);
        this.previousLogLength = this.state.log.length;

        const defeatedEntry = newEntries.find((entry) => entry.type === 'defeated');

        if (defeatedEntry) {
            this.showDefeatSequence(defeatedEntry, newEntries);
        } else {
            this.playAnimationsFromLog(newEntries);
            this.syncUI();
            this.continueAfterAction();
        }
    }

    // Muestra brevemente la carta en 0 HP antes de reemplazarla por la siguiente del mazo.
    showDefeatSequence(defeatedEntry, newEntries) {
        const preDefeatEntries = newEntries.filter(
            (entry) => entry !== defeatedEntry && entry.type !== 'card-entered'
        );
        this.playAnimationsFromLog(preDefeatEntries);

        const defeatedSideEl = this.querySelector(`.battle-side--${defeatedEntry.side}`);
        if (defeatedSideEl && defeatedSideEl.cardData) {
            const hpFill = defeatedSideEl.querySelector('.battle-card-hp-fill');
            const hpText = defeatedSideEl.querySelector('.battle-card-hp-text');
            if (hpFill) hpFill.style.width = '0%';
            if (hpText) hpText.textContent = `0 / ${defeatedSideEl.cardData.hp} HP`;

            defeatedSideEl.triggerAnimation('battle-anim-defeated');
            this.playSound(defeatedSideEl.cardData.sounds?.defeated);
        }

        setTimeout(() => {
            this.syncUI();
            const enteredEntry = newEntries.find((entry) => entry.type === 'card-entered');
            if (enteredEntry) {
                const enteredEl = this.querySelector(`.battle-side--${enteredEntry.side}`);
                if (enteredEl) enteredEl.triggerAnimation('battle-anim-enter');
            }
            this.continueAfterAction();
        }, DEFEAT_TRANSITION_MS);
    }

    continueAfterAction() {
        if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS) {
            this.handleBattleEnd();
            return;
        }
        if (this.state.turn === 'machine') {
            this.scheduleMachineTurn();
        }
    }

    // --- Turno de la máquina (placeholder temporal, se reemplaza en Etapa 8) ---

    scheduleMachineTurn() {
        const controls = this.querySelector('battle-controls');
        if (controls) {
            controls.setControls(
                engine.getActiveCard(this.state, 'machine'),
                { attackIds: [], canDefend: false, canUseSpecial: false },
                false
            );
        }
        setTimeout(() => this.performMachineTurn(), MACHINE_TURN_DELAY_MS);
    }

performMachineTurn() {
        if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS) return;
        const decision = decideMachineAction(this.state, 'machine');
        if (decision.type === 'attack') {
            engine.performAttack(this.state, 'machine', decision.attackId);
        } else if (decision.type === 'defense') {
            engine.performDefense(this.state, 'machine');
        } else if (decision.type === 'special') {
            engine.performSpecial(this.state, 'machine');
        }
        this.handleStateChange();
    }

    // --- Animaciones y sonido ---

    playAnimationsFromLog(entries) {
        entries.forEach((entry) => {
            const sideEl = this.querySelector(`.battle-side--${entry.side}`);

            if (entry.type === 'attack' || entry.type === 'special') {
                const opponentSide = entry.side === 'player' ? 'machine' : 'player';
                const opponentEl = this.querySelector(`.battle-side--${opponentSide}`);
                if (sideEl) sideEl.triggerAnimation('battle-anim-attack');
                if (opponentEl) opponentEl.triggerAnimation('battle-anim-damage');

                const attackerCard = engine.getActiveCard(this.state, entry.side);
                this.playSound(attackerCard.sounds?.[entry.type === 'special' ? 'special' : 'attack']);
            }

            if (entry.type === 'defense') {
                if (sideEl) sideEl.triggerAnimation('battle-anim-defense');
                const defendingCard = engine.getActiveCard(this.state, entry.side);
                this.playSound(defendingCard.sounds?.defense);
            }
        });
    }

    syncUI() {
        const playerCardEl = this.querySelector('.battle-side--player');
        const machineCardEl = this.querySelector('.battle-side--machine');
        const controlsEl = this.querySelector('battle-controls');
        const turnIndicatorEl = this.querySelector('.battle-turn-indicator');

        playerCardEl.setCard(engine.getActiveCard(this.state, 'player'), 'player');
        machineCardEl.setCard(engine.getActiveCard(this.state, 'machine'), 'machine');

        turnIndicatorEl.textContent = this.state.turn === 'player' ? 'TU TURNO' : 'TURNO DE LA MÁQUINA';
        turnIndicatorEl.className = `battle-turn-indicator battle-turn-indicator--${this.state.turn}`;

        if (this.isPlayerTurn()) {
            const activeCard = engine.getActiveCard(this.state, 'player');
            const availableActions = engine.getAvailableActions(this.state, 'player');
            controlsEl.setControls(activeCard, availableActions, true);
        } else {
            const activeCard = engine.getActiveCard(this.state, 'machine');
            controlsEl.setControls(activeCard, { attackIds: [], canDefend: false, canUseSpecial: false }, false);
        }
    }

    handleBattleEnd() {
        const isPlayerWinner = this.state.status === engine.BATTLE_STATUS.PLAYER_WON;

        const resultBanner = document.createElement('div');
        resultBanner.className = `battle-result ${isPlayerWinner ? 'battle-result--win' : 'battle-result--loss'}`;
        resultBanner.textContent = isPlayerWinner ? '🏆 ¡Victoria!' : '💀 Derrota';

        this.querySelector('.battle-arena').appendChild(resultBanner);
        this.playSound(isPlayerWinner ? '/sounds/victory.mp3' : '/sounds/defeat.mp3');

        // La Etapa 9 escuchará este evento para actualizar puntos y guardar el historial.
        this.dispatchEvent(new CustomEvent('battle-ended', {
            detail: {
                status: this.state.status,
                playerDeckIds: this.playerDeck.map((card) => card.id),
                machineDeckIds: this.machineDeck.map((card) => card.id),
                startedAt: this.startedAt,
                endedAt: new Date().toISOString(),
                log: this.state.log
            },
            bubbles: true
        }));
    }

    playSound(src) {
        if (!src) return;
        const audio = new Audio(src);
        audio.volume = 0.6;
        audio.play().catch(() => {
            // Los archivos de audio se agregan en la Etapa 24; hasta entonces
            // el fallo de reproducción se ignora para no interrumpir la partida.
        });
    }
}

customElements.define('battle-arena', BattleArena);