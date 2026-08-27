/// machineAI.js
// Estrategia de decisión automática, reutilizable tanto por la máquina (Etapa 8)
// como por el modo de "Batalla automática" del jugador (examen).
// NO es inteligencia artificial real: consulta las acciones disponibles, aplica
// unas reglas simples y elige una acción válida con pesos ponderados, de modo
// que el comportamiento se sienta razonable sin ser predecible ni invencible.

import { getActiveCard, getAvailableActions } from './battleEngine.js';

const BASE_WEIGHT = {
    ATTACK: 1,   // peso por CADA ataque disponible
    DEFENSE: 2,  // peso base de la opción "defender"
    SPECIAL: 3   // peso de la opción "usar especial", cuando está disponible
};

const LOW_HP_THRESHOLD = 0.3;      // por debajo de este % de vida, se prioriza defender
const LOW_HP_DEFENSE_BONUS = 4;    // peso extra de defensa cuando la vida es baja
const MAX_CONSECUTIVE_DEFENDS = 2; // a partir de aquí se evita seguir defendiendo

// Construye el pool de acciones válidas repitiendo cada una según su peso,
// de modo que Math.random() sobre el arreglo equivalga a una selección ponderada.
function buildWeightedPool(actions, card) {
    const pool = [];

    actions.attackIds.forEach((attackId) => {
        pool.push({ type: 'attack', attackId });
    });

    // Prioriza el poder especial cuando está disponible.
    if (actions.canUseSpecial) {
        for (let i = 0; i < BASE_WEIGHT.SPECIAL; i++) {
            pool.push({ type: 'special' });
        }
    }

    // Evita defenderse demasiadas veces consecutivas.
    const avoidDefense = card.consecutiveDefends >= MAX_CONSECUTIVE_DEFENDS;

    if (actions.canDefend && !avoidDefense) {
        const hpRatio = card.currentHp / card.hp;
        // Aumenta la posibilidad de defenderse si la vida es baja.
        const defenseWeight = hpRatio <= LOW_HP_THRESHOLD
            ? BASE_WEIGHT.DEFENSE + LOW_HP_DEFENSE_BONUS
            : BASE_WEIGHT.DEFENSE;

        for (let i = 0; i < defenseWeight; i++) {
            pool.push({ type: 'defense' });
        }
    }

    return pool;
}

// Punto de entrada usado por battle.js, tanto para el turno de la máquina
// como para el modo automático del jugador.
// Recibe el estado de la batalla y el lado ('player' | 'machine') y devuelve
// la acción elegida: { type: 'attack', attackId } | { type: 'defense' } | { type: 'special' }
export function decideAutoAction(battleState, side) {
    const card = getActiveCard(battleState, side);
    const availableActions = getAvailableActions(battleState, side);
    const pool = buildWeightedPool(availableActions, card);

    // No debería poder pasar (siempre hay al menos 1 ataque disponible),
    // pero se protege por si acaso para no romper el turno.
    if (pool.length === 0) {
        return { type: 'attack', attackId: availableActions.attackIds[0] };
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

// Alias retrocompatible: el nombre original se mantiene porque battle.js
// (Etapa 8) ya lo importaba para el turno de la máquina.
export const decideMachineAction = decideAutoAction;