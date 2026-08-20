// injectDeckStyles.js
// Inyecta deckStyles.css en el <head> una sola vez.

const STYLE_ID = 'deck-styles';

if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = '/src/components/deck/deckStyles.css';
    document.head.appendChild(link);
}