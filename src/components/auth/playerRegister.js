// playerRegister.js
// Web Component encargado del registro del jugador:
// valida el nickname, verifica duplicados contra la API y crea el jugador.

import { getPlayerByNickname, postPlayer } from '../../api/playersApi.js';
import { validateNickname, validatePassword } from '../../utils/validators.js';
import './injectAuthStyles.js';

const STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    ERROR: 'error',
    SUCCESS: 'success'
};

class PlayerRegister extends HTMLElement {
    constructor() {
        super();
        this.state = STATE.IDLE;
        this.errorMessage = '';
        this.render();
        this.configurarEventos();
    }

    render() {
        this.innerHTML = `
            <section class="auth-card">
                <h2 class="auth-title">⚡ Regístrate para batallar</h2>

                <form class="auth-form" novalidate>
                    <label for="nickname-input" class="auth-label">Nickname</label>
                    <input
                        id="nickname-input"
                        name="nickname"
                        type="text"
                        class="auth-input"
                        placeholder="Ej: JCMASTER"
                        autocomplete="off"
                        ${this.state === STATE.LOADING ? 'disabled' : ''}
                    />

                    <label for="password-input" class="auth-label">Contraseña</label>
                    <div class="auth-input-wrapper">
                        <input
                            id="password-input"
                            name="password"
                            type="password"
                            class="auth-input"
                            autocomplete="new-password"
                            ${this.state === STATE.LOADING ? 'disabled' : ''}
                        />
                        <button type="button" class="auth-eye-btn" data-target="password-input">👁</button>
                    </div>

                    <label for="password-confirm-input" class="auth-label">Confirmar contraseña</label>
                    <div class="auth-input-wrapper">
                        <input
                            id="password-confirm-input"
                            name="passwordConfirm"
                            type="password"
                            class="auth-input"
                            autocomplete="new-password"
                            ${this.state === STATE.LOADING ? 'disabled' : ''}
                        />
                        <button type="button" class="auth-eye-btn" data-target="password-confirm-input">👁</button>
                    </div>

                    <button type="submit" class="auth-button" ${this.state === STATE.LOADING ? 'disabled' : ''}>
                        ${this.state === STATE.LOADING ? 'Verificando...' : 'Registrarme'}
                    </button>
                </form>

                ${this.state === STATE.ERROR ? `<p class="auth-message auth-message--error">${this.errorMessage}</p>` : ''}
                ${this.state === STATE.SUCCESS ? `<p class="auth-message auth-message--success">¡Bienvenido, mago! Registro exitoso.</p>` : ''}

                <p class="auth-switch">¿Ya tienes cuenta?
                    <button type="button" class="auth-link" data-action="switch-login">Inicia sesión</button>
                </p>
            </section>
        `;
    }

    configurarEventos() {
        const form = this.querySelector('.auth-form');
        form.addEventListener('submit', (event) => this.handleSubmit(event));

        this.querySelector('[data-action="switch-login"]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('switch-auth-screen', {
                detail: { screen: 'login' },
                bubbles: true
            }));
        });

        this.querySelectorAll('.auth-eye-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const input = this.querySelector(`#${btn.dataset.target}`);
                if (!input) return;
                input.type = input.type === 'password' ? 'text' : 'password';
                btn.textContent = input.type === 'password' ? '👁' : '🙈';
            });
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const nicknameInput = this.querySelector('#nickname-input');
        const passwordInput = this.querySelector('#password-input');
        const passwordConfirmInput = this.querySelector('#password-confirm-input');

        const validation = validateNickname(nicknameInput.value);

        if (!validation.valid) {
            this.setError(validation.message);
            return;
        }

        const passwordValidation = validatePassword(passwordInput.value);

        if (!passwordValidation.valid) {
            this.setError(passwordValidation.message);
            return;
        }

        if (passwordInput.value !== passwordConfirmInput.value) {
            this.setError('Las contraseñas no coinciden.');
            return;
        }

        this.setState(STATE.LOADING);

        try {
            const existingPlayer = await getPlayerByNickname(validation.value);

            if (existingPlayer) {
                this.setError('Ese nickname ya está en uso. Elige otro.');
                return;
            }

            const newPlayer = {
                id: `player-${Date.now()}`,
                nickname: validation.value,
                password: passwordValidation.value,
                points: 0,
                wins: 0,
                losses: 0,
                gamesPlayed: 0,
                createdAt: new Date().toISOString()
            };

            const createdPlayer = await postPlayer(newPlayer);

            this.setState(STATE.SUCCESS);
            this.notifyPlayerRegistered(createdPlayer);

        } catch (error) {
            this.setError('No se pudo conectar con el servidor. Intenta nuevamente.');
        }
    }

    setError(message) {
        this.errorMessage = message;
        this.setState(STATE.ERROR);
    }

    setState(newState) {
        this.state = newState;
        this.render();
        this.configurarEventos();
    }

    notifyPlayerRegistered(player) {
        this.dispatchEvent(new CustomEvent('player-registered', {
            detail: { player },
            bubbles: true
        }));
    }
}

customElements.define('player-register', PlayerRegister);