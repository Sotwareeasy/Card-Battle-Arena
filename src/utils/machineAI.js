// machineAI.js
// NO es inteligencia artificial real. Es una función determinista + aleatoria
// que: 1) consulta las acciones disponibles, 2) descarta las bloqueadas,
// 3) selecciona una acción válida con pesos simples para que la máquina
// se sienta "razonable" sin ser predecible ni invencible.

import { getAvailableActions } from './battleEngine.js';

const WEIGHT = {
    ATTACK: 1,   // peso por CADA ataque disponible
    DEFENSE: 2,  // peso total de la opción "defender"
    SPECIAL: 3   // peso total de la opción "usar especial", cuando está disponible
};

// Construye el pool de acciones válidas repitiendo cada una según su peso,
// de modo que Math.random() sobre el arreglo equivalga a una selección ponderada.
function buildWeightedPool(actions) {
    const pool = [];

    actions.attackIds.forEach((attackId) => {
        pool.push({ type: 'attack', attackId });
    });

    if (actions.canDefend) {
        for (let i = 0; i < WEIGHT.DEFENSE; i++) {
            pool.push({ type: 'defense' });
        }
    }

    if (actions.canUseSpecial) {
        for (let i = 0; i < WEIGHT.SPECIAL; i++) {
            pool.push({ type: 'special' });
        }
    }

    return pool;
}

// Punto de entrada usado por battle.js.
// Recibe el estado de la batalla y el lado ('machine') y devuelve
// la acción elegida: { type: 'attack', attackId } | { type: 'defense' } | { type: 'special' }
export function decideMachineAction(battleState, side) {
    const availableActions = getAvailableActions(battleState, side);
    const pool = buildWeightedPool(availableActions);

    // No debería poder pasar (siempre hay al menos 1 ataque disponible),
    // pero se protege por si acaso para no romper el turno.
    if (pool.length === 0) {
        return { type: 'attack', attackId: availableActions.attackIds[0] };
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}