// cardsApi.js
// Todas las operaciones CRUD sobre el recurso /cards

import { apiRequest } from './apiConfig.js';

export async function getCards() {
    return apiRequest('/cards');
}

export async function getCardById(id) {
    return apiRequest(`/cards/${id}`);
}

export async function postCard(card) {
    return apiRequest('/cards', {
        method: 'POST',
        body: JSON.stringify(card)
    });
}

export async function putCard(card, id) {
    return apiRequest(`/cards/${id}`, {
        method: 'PUT',
        body: JSON.stringify(card)
    });
}

export async function patchCard(data, id) {
    return apiRequest(`/cards/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
    });
}

export async function deleteCard(id) {
    return apiRequest(`/cards/${id}`, {
        method: 'DELETE'
    });
}