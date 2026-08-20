// injectAuthStyles.js
// Inyecta authStyles.css en el <head> una sola vez, evitando duplicados.
// Patrón reutilizado por otros módulos de componentes en etapas posteriores.

const STYLE_ID = 'auth-styles';

if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = '/src/components/auth/authStyles.css';
    document.head.appendChild(link);
}