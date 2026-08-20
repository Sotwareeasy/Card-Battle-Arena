// battlesApi.js
// Registro del historial de batallas

import { apiRequest } from './apiConfig.js';

export async function getBattles() {
    return apiRequest('/battles');
}

export async function getBattlesByPlayer(playerId) {
    return apiRequest(`/battles?playerId=${playerId}`);
}

export async function postBattle(battle) {
    return apiRequest('/battles', {
        method: 'POST',
        body: JSON.stringify(battle)
    });
}