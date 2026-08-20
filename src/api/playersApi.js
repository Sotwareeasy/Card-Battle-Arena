// playersApi.js
// Operaciones sobre el recurso /players

import { apiRequest } from './apiConfig.js';

export async function getPlayers() {
    return apiRequest('/players');
}

// Usado para validar unicidad de nickname antes de registrar
export async function getPlayerByNickname(nickname) {
    const players = await apiRequest(`/players?nickname=${encodeURIComponent(nickname)}`);
    return players.length > 0 ? players[0] : null;
}

export async function postPlayer(player) {
    return apiRequest('/players', {
        method: 'POST',
        body: JSON.stringify(player)
    });
}

export async function patchPlayer(data, id) {
    return apiRequest(`/players/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}