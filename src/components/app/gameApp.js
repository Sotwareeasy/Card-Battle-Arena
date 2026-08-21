// gameApp.js
// Componente raíz de la aplicación. Orquesta las pantallas:
// registro -> selección de mazo -> batalla -> resultados -> (Etapa 10: leaderboard).

import { patchPlayer } from '../../api/playersApi.js';
import { postBattle } from '../../api/battlesApi.js';

const SCREEN = {
    REGISTER: 'register',
    DECK_SELECTION: 'deck-selection',
    BATTLE: 'battle',
    RESULTS: 'results',
    LEADERBOARD: 'leaderboard',
    ADMIN_LOGIN: 'admin-login',
    ADMIN_PANEL: 'admin-panel'
};

const POINTS_ON_WIN = 50;
const POINTS_ON_LOSS = 10;

class GameApp extends HTMLElement {
    constructor() {
        super();
        this.currentPlayer = null;
        this.currentScreen = SCREEN.REGISTER;
        this.playerDeck = null;
        this.machineDeck = null;

        // Estado de la pantalla de resultados
        this.currentAdmin = null;

        // Estado de la pantalla de resultados
        this.lastResult = null;      // 'win' | 'loss'
        this.pointsAwarded = 0;
        this.isSavingResults = false;
        this.saveError = '';

        this.render();
        this.configurarEventos();
    }

    render() {
        this.innerHTML = `
            <header class="game-header">
                <h1>Card Battle Arena</h1>
                <p>Harry Potter Edition</p>
                ${this.currentPlayer ? `<p class="game-header-player">Jugador: ${this.currentPlayer.nickname}</p>` : ''}
                ${this.currentAdmin ? `<p class="game-header-player">Admin: ${this.currentAdmin.username}</p>` : ''}
                <button type="button" class="game-header-admin-link" data-action="go-admin">⚙ Admin</button>
            </header>
            <div class="game-screen"></div>
        `;
        this.renderScreen();
    }

    renderScreen() {
        const screenContainer = this.querySelector('.game-screen');

        if (this.currentScreen === SCREEN.REGISTER) {
            screenContainer.innerHTML = '<player-register></player-register>';
            return;
        }

        if (this.currentScreen === SCREEN.DECK_SELECTION) {
            screenContainer.innerHTML = '<deck-selector></deck-selector>';
            return;
        }

        if (this.currentScreen === SCREEN.BATTLE) {
            screenContainer.innerHTML = '';
            const battleArena = document.createElement('battle-arena');
            battleArena.playerDeck = this.playerDeck;
            battleArena.machineDeck = this.machineDeck;
            screenContainer.appendChild(battleArena);
            return;
        }

    if (this.currentScreen === SCREEN.RESULTS) {
            screenContainer.innerHTML = this.renderResultsScreen();
            return;
        }

    if (this.currentScreen === SCREEN.LEADERBOARD) {
            screenContainer.innerHTML = '<leaderboard-view></leaderboard-view>';
            return;
        }

        if (this.currentScreen === SCREEN.ADMIN_LOGIN) {
            screenContainer.innerHTML = '<admin-login></admin-login>';
            return;
        }

        if (this.currentScreen === SCREEN.ADMIN_PANEL) {
            screenContainer.innerHTML = '<cards-manager></cards-manager>';
        }
    }

    // Reutilizo las clases de authStyles.css (ya cargadas desde el registro)
    // para no crear un archivo CSS nuevo solo para esta pantalla.
    renderResultsScreen() {
        const isWin = this.lastResult === 'win';

        return `
            <section class="auth-card">
                <h2 class="auth-title">${isWin ? '🏆 ¡Victoria!' : '💀 Derrota'}</h2>

                ${this.isSavingResults ? `
                    <p class="auth-message">Guardando resultados...</p>
                ` : `
                    <p class="auth-message ${isWin ? 'auth-message--success' : ''}">
                        +${this.pointsAwarded} puntos
                    </p>
                    <p class="auth-message">
                        Puntos totales: ${this.currentPlayer.points} ·
                        Victorias: ${this.currentPlayer.wins} ·
                        Derrotas: ${this.currentPlayer.losses} ·
                        Partidas: ${this.currentPlayer.gamesPlayed}
                    </p>
                    ${this.saveError ? `<p class="auth-message auth-message--error">${this.saveError}</p>` : ''}
                    <button type="button" class="auth-button leaderboard-nav-btn">Ver leaderboard</button>
                `}
            </section>
        `;
    }

    configurarEventos() {
        this.addEventListener('player-registered', (event) => {
            this.currentPlayer = event.detail.player;
            this.currentScreen = SCREEN.DECK_SELECTION;
            this.render();
        });

        this.addEventListener('deck-selected', (event) => {
            this.playerDeck = event.detail.playerDeck;
            this.machineDeck = event.detail.machineDeck;
            this.currentScreen = SCREEN.BATTLE;
            this.render();
        });

        this.addEventListener('battle-ended', (event) => {
            this.handleBattleEnded(event.detail);
        });

        this.addEventListener('click', (event) => {
            if (event.target.classList.contains('leaderboard-nav-btn')) {
                this.currentScreen = SCREEN.LEADERBOARD;
                this.render();
            }
            if (event.target.dataset.action === 'go-admin') {
                this.currentScreen = this.currentAdmin ? SCREEN.ADMIN_PANEL : SCREEN.ADMIN_LOGIN;
                this.render();
            }
        });

        this.addEventListener('admin-logged-in', (event) => {
            this.currentAdmin = event.detail.admin;
            this.currentScreen = SCREEN.ADMIN_PANEL;
            this.render();
        });
    }

    async handleBattleEnded(battleDetail) {
        const isWin = battleDetail.status === 'player-won';

        this.lastResult = isWin ? 'win' : 'loss';
        this.pointsAwarded = isWin ? POINTS_ON_WIN : POINTS_ON_LOSS;
        this.isSavingResults = true;
        this.saveError = '';
        this.currentScreen = SCREEN.RESULTS;
        this.render();

        const updatedStats = {
            points: this.currentPlayer.points + this.pointsAwarded,
            wins: this.currentPlayer.wins + (isWin ? 1 : 0),
            losses: this.currentPlayer.losses + (isWin ? 0 : 1),
            gamesPlayed: this.currentPlayer.gamesPlayed + 1
        };

        const battleRecord = {
            id: `battle-${Date.now()}`,
            playerId: this.currentPlayer.id,
            playerNickname: this.currentPlayer.nickname,
            result: this.lastResult,
            pointsAwarded: this.pointsAwarded,
            playerDeck: battleDetail.playerDeckIds,
            machineDeck: battleDetail.machineDeckIds,
            startedAt: battleDetail.startedAt,
            endedAt: battleDetail.endedAt
        };

        try {
            await patchPlayer(updatedStats, this.currentPlayer.id);
            this.currentPlayer = { ...this.currentPlayer, ...updatedStats };

            await postBattle(battleRecord);

            this.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: 'Resultados guardados correctamente.', type: 'success' },
                bubbles: true
            }));
        } catch (error) {
            this.saveError = 'No se pudo guardar tu progreso en el servidor. Tu resultado se mostró localmente, pero no quedó registrado.';

            this.dispatchEvent(new CustomEvent('show-toast', {
                detail: { message: 'No se pudo guardar el progreso.', type: 'error' },
                bubbles: true
            }));
        } finally {
            this.isSavingResults = false;
            this.render();
        }
    }
}

customElements.define('game-app', GameApp);