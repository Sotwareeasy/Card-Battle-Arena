// adminLogin.js
// Web Component de login administrativo. Valida credenciales contra /admins.
// Reutiliza authStyles.css (ya cargado desde playerRegister.js) para no duplicar estilos.

import { validateAdminCredentials } from '../../api/adminsApi.js';

const STATE = {
    IDLE: 'idle',
    LOADING: 'loading',
    ERROR: 'error'
};

class AdminLogin extends HTMLElement {
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
                <h2 class="auth-title">🔐 Panel Administrativo</h2>

                <form class="auth-form" novalidate>
                    <label for="admin-username" class="auth-label">Usuario</label>
                    <input id="admin-username" name="username" type="text" class="auth-input" autocomplete="off" ${this.state === STATE.LOADING ? 'disabled' : ''} />

                    <label for="admin-password" class="auth-label">Contraseña</label>
                    <div class="auth-input-wrapper">
                        <input id="admin-password" name="password" type="password" class="auth-input" autocomplete="off" ${this.state === STATE.LOADING ? 'disabled' : ''} />
                        <button type="button" class="auth-eye-btn" data-target="admin-password">👁</button>
                    </div>

                    <button type="submit" class="auth-button" ${this.state === STATE.LOADING ? 'disabled' : ''}>
                        ${this.state === STATE.LOADING ? 'Verificando...' : 'Ingresar'}
                    </button>
                </form>

                ${this.state === STATE.ERROR ? `<p class="auth-message auth-message--error">${this.errorMessage}</p>` : ''}
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
                btn.textContent = input.type === 'password' ? '👁' : '🙈';
            });
        });
    }

    async handleSubmit(event) {
        event.preventDefault();

        const username = this.querySelector('#admin-username').value.trim();
        const password = this.querySelector('#admin-password').value.trim();

        if (!username || !password) {
            this.setError('Usuario y contraseña son obligatorios.');
            return;
        }

        this.setState(STATE.LOADING);

        try {
            const admin = await validateAdminCredentials(username, password);

            if (!admin) {
                this.setError('Credenciales incorrectas.');
                return;
            }

            this.dispatchEvent(new CustomEvent('admin-logged-in', {
                detail: { admin },
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

customElements.define('admin-login', AdminLogin);