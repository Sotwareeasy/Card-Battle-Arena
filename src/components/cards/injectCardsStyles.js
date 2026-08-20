// injectCardsStyles.js
// Inyecta cardsStyles.css en el <head> una sola vez.

const STYLE_ID = 'cards-styles';

if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = '/src/components/cards/cardsStyles.css';
    document.head.appendChild(link);
}