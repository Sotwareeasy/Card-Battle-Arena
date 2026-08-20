// injectLeaderboardStyles.js
// Inyecta leaderboardStyles.css en el <head> una sola vez.

const STYLE_ID = 'leaderboard-styles';

if (!document.getElementById(STYLE_ID)) {
    const link = document.createElement('link');
    link.id = STYLE_ID;
    link.rel = 'stylesheet';
    link.href = '/src/components/leaderboard/leaderboardStyles.css';
    document.head.appendChild(link);
}