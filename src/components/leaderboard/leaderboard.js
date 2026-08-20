// leaderboard.js
// Web Component que muestra el ranking de jugadores ordenado de mayor a menor puntaje,
// destacando el Top 3.

import { getPlayers } from '../../api/playersApi.js';
import './injectLeaderboardStyles.js';

const STATE = {
    LOADING: 'loading',
    ERROR: 'error',
    READY: 'ready'
};

const MEDALS = ['🥇', '🥈', '🥉'];

class LeaderboardView extends HTMLElement {
    constructor() {
        super();
        this.state = STATE.LOADING;
        this.players = [];
    }

    connectedCallback() {
        this.loadPlayers();
    }

    async loadPlayers() {
        this.state = STATE.LOADING;
        this.render();

        try {
            const players = await getPlayers();
            this.players = [...players].sort((a, b) => b.points - a.points);
            this.state = STATE.READY;
        } catch (error) {
            this.state = STATE.ERROR;
        }

        this.render();
        this.configurarEventos();
    }

    render() {
        if (this.state === STATE.LOADING) {
            this.innerHTML = `<p class="leaderboard-status">Cargando leaderboard...</p>`;
            return;
        }

        if (this.state === STATE.ERROR) {
            this.innerHTML = `
                <p class="leaderboard-status leaderboard-status--error">
                    No se pudo cargar el leaderboard. Verifica que el servidor esté activo.
                </p>
                <button type="button" class="leaderboard-retry-btn">Reintentar</button>
            `;
            return;
        }

        if (this.players.length === 0) {
            this.innerHTML = `<p class="leaderboard-status">Todavía no hay jugadores registrados.</p>`;
            return;
        }

        this.innerHTML = `
            <section class="leaderboard">
                <h2 class="leaderboard-title">🏆 Leaderboard</h2>
                <ol class="leaderboard-list">
                    ${this.players.map((player, index) => this.renderPlayerRow(player, index)).join('')}
                </ol>
            </section>
        `;
    }

    renderPlayerRow(player, index) {
        const position = index + 1;
        const isTopThree = index < 3;

        return `
            <li class="leaderboard-row ${isTopThree ? 'leaderboard-row--top' : ''}">
                <span class="leaderboard-position">${isTopThree ? MEDALS[index] : position}</span>
                <span class="leaderboard-nickname">${player.nickname}</span>
                <span class="leaderboard-stat">${player.points} pts</span>
                <span class="leaderboard-stat">${player.wins} victorias</span>
                <span class="leaderboard-stat">${player.gamesPlayed} partidas</span>
            </li>
        `;
    }

    configurarEventos() {
        const retryButton = this.querySelector('.leaderboard-retry-btn');
        if (retryButton) {
            retryButton.addEventListener('click', () => this.loadPlayers());
        }
    }
}

customElements.define('leaderboard-view', LeaderboardView);