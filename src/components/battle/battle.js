// Orquestador de la pantalla de combate. Conecta battleEngine.js (lógica pura)
// con battle-card y battle-controls (UI), maneja animaciones y sonido.
//
// Recibe el mazo del jugador y de la máquina mediante propiedades JS
// (this.playerDeck / this.machineDeck), asignadas por gameApp.js ANTES
// de insertar el elemento en el DOM.

import * as engine from '../../utils/battleEngine.js';
import { play } from '../../utils/soundManager.js';
import { decideAutoAction } from '../../utils/machineAI.js';
import './battleCard.js';
import './battleControls.js';
import './injectBattleStyles.js';

const MACHINE_TURN_DELAY_MS = 1200;
const AUTO_PLAYER_TURN_DELAY_MS = 1200; // misma pausa visible que el turno de la máquina
const DEFEAT_TRANSITION_MS = 900;

class BattleArena extends HTMLElement {
    constructor() {
        super();
        this.playerDeck = null;
        this.machineDeck = null;
        this.state = null;
        this.previousLogLength = 0;
        this.startedAt = null;
        // 'manual' (default) o 'automatic'. gameApp.js puede fijar esta
        // propiedad ANTES de insertar el elemento en el DOM.
        this.mode = 'manual';
        this.pendingTimeoutId = null; // permite cancelar el turno automático pendiente
        this.turnInProgress = false;  // evita doble acción / cambios de modo a mitad de turno
    }

    connectedCallback() {
        this.startedAt = new Date().toISOString();
        this.state = engine.createInitialBattleState(this.playerDeck, this.machineDeck);
        this.render();
        this.configurarEventos();
        this.syncUI();

        if (this.state.turn === 'machine') {
            this.scheduleMachineTurn();
        } else if (this.mode === 'automatic') {
            this.scheduleAutoPlayerTurn();
        }
    }

    // Se detienen los temporizadores pendientes si el componente se desmonta
    // (ej. el jugador navega fuera de la pantalla de batalla).
    disconnectedCallback() {
        this.clearPendingTimeout();
    }

    clearPendingTimeout() {
        if (this.pendingTimeoutId) {
            clearTimeout(this.pendingTimeoutId);
            this.pendingTimeoutId = null;
        }
    }

    render() {
        this.innerHTML = `
            <section class="battle-arena">
                <p class="battle-turn-indicator"></p>
                <div class="battle-mode-bar">
                    <button type="button" class="battle-mode-btn" data-action="toggle-mode">
                        ${this.mode === 'automatic' ? '🤖 Modo: Automático' : '🎮 Modo: Manual'}
                    </button>
                </div>
                <div class="battle-field">
                    <battle-card class="battle-side battle-side--player"></battle-card>
                    <span class="battle-vs">VS</span>
                    <battle-card class="battle-side battle-side--machine"></battle-card>
                </div>
                <battle-controls></battle-controls>
                <button class="battle-surrender-btn">🏳️ Terminar Batalla</button>
            </section>
        `;
    }

    configurarEventos() {
        this.addEventListener('action-attack', (event) => {
            if (!this.isPlayerTurn() || this.mode === 'automatic' || this.turnInProgress) return;
            engine.performAttack(this.state, 'player', event.detail.attackId);
            this.handleStateChange();
        });

        this.addEventListener('action-defense', () => {
            if (!this.isPlayerTurn() || this.mode === 'automatic' || this.turnInProgress) return;
            engine.performDefense(this.state, 'player');
            this.handleStateChange();
        });

        this.addEventListener('action-special', () => {
            if (!this.isPlayerTurn() || this.mode === 'automatic' || this.turnInProgress) return;
            engine.performSpecial(this.state, 'player');
            this.handleStateChange();
        });

        this.addEventListener('click', (e) => {
            if (e.target.closest('.battle-mode-btn')) {
                this.toggleMode();
                return;
            }

            if (!e.target.classList.contains('battle-surrender-btn')) return;
            if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS) return;
            this.clearPendingTimeout();
            this.state.status = engine.BATTLE_STATUS.MACHINE_WON;
            this.handleBattleEnd();
        });
    }

    // Cambia entre modo manual y automático desde el control de la propia pantalla de batalla
    toggleMode() {
        if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS) return;

        this.mode = this.mode === 'automatic' ? 'manual' : 'automatic';

        const modeBtn = this.querySelector('.battle-mode-btn');
        if (modeBtn) {
            modeBtn.textContent = this.mode === 'automatic' ? '🤖 Modo: Automático' : '🎮 Modo: Manual';
        }

        // Al cambiar a manual, cancelamos cualquier acción automática en espera y liberamos la bandera
        if (this.mode === 'manual' && this.isPlayerTurn()) {
            this.clearPendingTimeout();
            this.turnInProgress = false;
        }

        this.syncUI();

        if (this.mode === 'automatic' && this.isPlayerTurn() && !this.turnInProgress) {
            this.scheduleAutoPlayerTurn();
        }
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
            this.safePlayAnimationsFromLog(newEntries);
            this.syncUI();
            this.continueAfterAction();
        }
    }

    // Muestra brevemente la carta en 0 HP antes de reemplazarla por la siguiente del mazo.
    showDefeatSequence(defeatedEntry, newEntries) {
        const preDefeatEntries = newEntries.filter(
            (entry) => entry !== defeatedEntry && entry.type !== 'card-entered'
        );
        this.safePlayAnimationsFromLog(preDefeatEntries);

        const defeatedSideEl = this.querySelector(`.battle-side--${defeatedEntry.side}`);
        if (defeatedSideEl && defeatedSideEl.cardData) {
            const hpFill = defeatedSideEl.querySelector('.battle-card-hp-fill');
            const hpText = defeatedSideEl.querySelector('.battle-card-hp-text');
            if (hpFill) hpFill.style.width = '0%';
            if (hpText) hpText.textContent = `0 / ${defeatedSideEl.cardData.hp} HP`;

            defeatedSideEl.triggerAnimation('battle-anim-defeated');
            this.playSound(defeatedSideEl.cardData.sounds?.defeated);
        }

        this.turnInProgress = true;
        this.clearPendingTimeout();
        this.pendingTimeoutId = setTimeout(() => {
            this.pendingTimeoutId = null;
            this.turnInProgress = false;
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
        } else if (this.mode === 'automatic') {
            this.scheduleAutoPlayerTurn();
        }
    }

    // --- Turno de la máquina ---

    scheduleMachineTurn() {
        if (this.turnInProgress) return; // Evita duplicar llamadas si ya hay una animación o turno en marcha

        const controls = this.querySelector('battle-controls');
        if (controls) {
            controls.setControls(
                engine.getActiveCard(this.state, 'machine'),
                { attackIds: [], canDefend: false, canUseSpecial: false },
                false,
                '🤖 Turno de la máquina...'
            );
        }
        this.turnInProgress = true;
        this.clearPendingTimeout();
        this.pendingTimeoutId = setTimeout(() => this.performMachineTurn(), MACHINE_TURN_DELAY_MS);
    }

    performMachineTurn() {
        this.pendingTimeoutId = null;
        this.turnInProgress = false;
        if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS) return;

        try {
            const available = engine.getAvailableActions(this.state, 'machine');
            const decision = decideAutoAction(this.state, 'machine');

            if (decision && decision.type === 'attack' && available.attackIds.includes(decision.attackId)) {
                engine.performAttack(this.state, 'machine', decision.attackId);
            } else if (decision && decision.type === 'defense' && available.canDefend) {
                engine.performDefense(this.state, 'machine');
            } else if (decision && decision.type === 'special' && available.canUseSpecial) {
                engine.performSpecial(this.state, 'machine');
            } else {
                this.executeFallbackTurn('machine', available);
            }
        } catch (error) {
            console.warn('Error durante el turno de la máquina, aplicando fallback:', error);
            const available = engine.getAvailableActions(this.state, 'machine');
            this.executeFallbackTurn('machine', available);
        }

        this.handleStateChange();
    }

    // --- Modo automático del jugador ---

    scheduleAutoPlayerTurn() {
        if (this.turnInProgress) return; // Evita duplicar llamadas si ya hay una animación o turno en marcha

        const controls = this.querySelector('battle-controls');
        if (controls) {
            controls.setControls(
                engine.getActiveCard(this.state, 'player'),
                { attackIds: [], canDefend: false, canUseSpecial: false },
                false,
                '🤖 Acción automática en curso...'
            );
        }
        this.turnInProgress = true;
        this.clearPendingTimeout();
        this.pendingTimeoutId = setTimeout(() => this.performAutoPlayerTurn(), AUTO_PLAYER_TURN_DELAY_MS);
    }

    performAutoPlayerTurn() {
        this.pendingTimeoutId = null;
        this.turnInProgress = false;
        if (this.state.status !== engine.BATTLE_STATUS.IN_PROGRESS || this.state.turn !== 'player') return;

        try {
            const available = engine.getAvailableActions(this.state, 'player');
            const decision = decideAutoAction(this.state, 'player');

            if (decision && decision.type === 'attack' && available.attackIds.includes(decision.attackId)) {
                engine.performAttack(this.state, 'player', decision.attackId);
            } else if (decision && decision.type === 'defense' && available.canDefend) {
                engine.performDefense(this.state, 'player');
            } else if (decision && decision.type === 'special' && available.canUseSpecial) {
                engine.performSpecial(this.state, 'player');
            } else {
                this.executeFallbackTurn('player', available);
            }
        } catch (error) {
            console.warn('Error durante el turno automático del jugador:', error);
            const available = engine.getAvailableActions(this.state, 'player');
            this.executeFallbackTurn('player', available);
        }

        this.handleStateChange();
    }

    // --- Fallback de seguridad contra Cooldowns o IA bloqueada ---

    executeFallbackTurn(side, available) {
        if (available && available.attackIds && available.attackIds.length > 0) {
            engine.performAttack(this.state, side, available.attackIds[0]);
        } else if (available && available.canDefend) {
            engine.performDefense(this.state, side);
        } else if (available && available.canUseSpecial) {
            engine.performSpecial(this.state, side);
        } else {
            const activeCard = engine.getActiveCard(this.state, side);
            const defaultAttackId = activeCard?.attacks?.[0]?.id || 1;
            engine.performAttack(this.state, side, defaultAttackId);
        }
    }

    // --- Animaciones y sonido ---

    // Envoltorio defensivo: un fallo al animar/mostrar feedback (ej. crítico o esquive)
    // NUNCA debe congelar la batalla ni impedir que se agende el siguiente turno.
    safePlayAnimationsFromLog(entries) {
        try {
            this.playAnimationsFromLog(entries);
        } catch (error) {
            console.warn('Error al reproducir animaciones/sonido, se continúa la batalla:', error);
        }
    }

    playAnimationsFromLog(entries) {
        entries.forEach((entry) => {
            const sideEl = this.querySelector(`.battle-side--${entry.side}`);

            if (entry.type === 'attack' || entry.type === 'special') {
                const opponentSide = entry.side === 'player' ? 'machine' : 'player';
                const opponentEl = this.querySelector(`.battle-side--${opponentSide}`);
                if (sideEl) sideEl.triggerAnimation('battle-anim-attack');

                const attackerCard = engine.getActiveCard(this.state, entry.side);
                this.playSound(attackerCard.sounds?.[entry.type === 'special' ? 'special' : 'attack']);

                if (entry.dodged) {
                    if (opponentEl) opponentEl.showFeedback('¡ATAQUE ESQUIVADO!', 'dodge');
                    play('dodge');
                } else {
                    if (opponentEl) opponentEl.triggerAnimation('battle-anim-damage');
                    if (entry.critical) {
                        if (opponentEl) opponentEl.showFeedback('¡GOLPE CRÍTICO!', 'critical');
                        play('critical');
                    }
                }
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

            if (this.mode === 'automatic') {
                controlsEl.setControls(
                    activeCard,
                    { attackIds: [], canDefend: false, canUseSpecial: false },
                    false,
                    '🤖 Acción automática en curso...'
                );
            } else {
                const availableActions = engine.getAvailableActions(this.state, 'player');
                controlsEl.setControls(activeCard, availableActions, true);
            }
        } else {
            const activeCard = engine.getActiveCard(this.state, 'machine');
            controlsEl.setControls(
                activeCard,
                { attackIds: [], canDefend: false, canUseSpecial: false },
                false,
                '🤖 Turno de la máquina...'
            );
        }
    }

    handleBattleEnd() {
        this.clearPendingTimeout();

        const isPlayerWinner = this.state.status === engine.BATTLE_STATUS.PLAYER_WON;

        const resultBanner = document.createElement('div');
        resultBanner.className = `battle-result ${isPlayerWinner ? 'battle-result--win' : 'battle-result--loss'}`;
        resultBanner.textContent = isPlayerWinner ? '🏆 ¡Victoria!' : '💀 Derrota';

        this.querySelector('.battle-arena').appendChild(resultBanner);
        this.playSound(isPlayerWinner ? '/sounds/victory.mp3' : '/sounds/defeat.mp3');

        this.dispatchEvent(new CustomEvent('battle-ended', {
            detail: {
                status: this.state.status,
                mode: this.mode,
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
        if (src.includes('attack')) play('attack');
        else if (src.includes('defense')) play('defense');
        else if (src.includes('special')) play('special');
        else if (src.includes('defeated')) play('defeated');
        else if (src.includes('victory')) play('victory');
        else if (src.includes('defeat')) play('defeat');
    }
}

customElements.define('battle-arena', BattleArena);