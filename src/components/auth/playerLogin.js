// playerLogin.js
// Web Component de login para jugadores ya registrados.
// Valida credenciales contra /players (nickname + password).
// Reutiliza authStyles.css (ya cargado desde playerRegister.js) para no duplicar estilos.

import { validatePlayerCredentials } from '../../api/playersApi.js';
import './injectAuthStyles.js';

const STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    ERROR: 'error'
};

class PlayerLogin extends HTMLElement {
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
                <h2 class="auth-title">🪄 Inicia sesión</h2>

                <form class="auth-form" novalidate>
                    <label for="login-nickname" class="auth-label">Nickname</label>
                    <input id="login-nickname" name="nickname" type="text" class="auth-input" autocomplete="off" ${this.state === STATE.LOADING ? 'disabled' : ''} />

                    <label for="login-password" class="auth-label">Contraseña</label>
                    <div class="auth-input-wrapper">
                        <input id="login-password" name="password" type="password" class="auth-input" autocomplete="current-password" ${this.state === STATE.LOADING ? 'disabled' : ''} />
                        <button type="button" class="auth-eye-btn" data-target="login-password">👁</button>
                    </div>

                    <button type="submit" class="auth-button" ${this.state === STATE.LOADING ? 'disabled' : ''}>
                        ${this.state === STATE.LOADING ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>

                ${this.state === STATE.ERROR ? `<p class="auth-message auth-message--error">${this.errorMessage}</p>` : ''}

                <p class="auth-switch">¿Aún no tienes cuenta?
                    <button type="button" class="auth-link" data-action="switch-register">Regístrate</button>
                </p>
            </section>
        `;
    }

    configurarEventos() {
        this.querySelector('.auth-form').addEventListener('submit', (event) => this.handleSubmit(event));

        this.querySelectorAll('.auth-eye-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                const input = this.querySelector(`#${btn.dataset.target}`);
                if (!input) return;
                input.type = input.type === 'password' ? 'text' : 'password';
                btn.textContent = input.type === 'password' ? '👁' : '🔒';
            });
        });

        this.querySelector('[data-action="switch-register"]').addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('switch-auth-screen', {
                detail: { screen: 'register' },
                bubbles: true
            }));
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const nickname = this.querySelector('#login-nickname').value.trim();
        const password = this.querySelector('#login-password').value;

        if (!nickname || !password) {
            this.setError('Nickname y contraseña son obligatorios.');
            return;
        }

        this.setState(STATE.LOADING);

        try {
            const player = await validatePlayerCredentials(nickname, password);

            if (!player) {
                this.setError('Credenciales incorrectas.');
                return;
            }

            this.dispatchEvent(new CustomEvent('player-logged-in', {
                detail: { player },
                bubbles: true
            }));
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
}

customElements.define('player-login', PlayerLogin);