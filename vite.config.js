// vite.config.js
// Necesario para permitir que "vite preview" acepte peticiones que llegan
// con el host público de Railway, en lugar de solo localhost/127.0.0.1.

import { defineConfig } from 'vite';

export default defineConfig({
    preview: {
        allowedHosts: [
            'card-battle-arena-frontend-production.up.railway.app'
        ]
    }
});