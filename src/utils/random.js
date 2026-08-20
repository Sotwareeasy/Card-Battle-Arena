// random.js
// Utilidades de aleatoriedad usadas por el mazo de la máquina y por el motor de batalla.

export function shuffleArray(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

export function pickRandomCards(pool, count, excludeIds = []) {
    const available = pool.filter((card) => !excludeIds.includes(card.id));
    return shuffleArray(available).slice(0, count);
}

// Calcula el daño real aplicando la variación aleatoria del 85%-115%
// definida en el documento de requisitos.
export function computeRandomDamage(baseDamage) {
    const factor = 0.85 + Math.random() * 0.30;
    return Math.round(baseDamage * factor);
}