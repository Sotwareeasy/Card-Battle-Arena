// battleEngine.js
// Motor de batalla: funciones puras, sin DOM, sin fetch.
// Reciben el estado actual de la batalla y lo modifican según las reglas del juego.
// Esta separación permite probar el motor de forma aislada (por consola) y
// explicarlo con claridad en la sustentación.

import { computeRandomDamage } from './random.js';

export const BATTLE_STATUS = {
    IN_PROGRESS: 'in-progress',
    PLAYER_WON: 'player-won',
    MACHINE_WON: 'machine-won',
    ABANDONED: 'abandoned' // el jugador se rinde/abandona antes de que la batalla termine por sí sola
};

// Reglas de eventos probabilísticos (ver README, sección "Nuevas mecánicas")
export const DODGE_CHANCE = 0.08;
export const CRITICAL_CHANCE = 0.12;
export const CRITICAL_MULTIPLIER = 1.5;

// --- Creación del estado inicial ---

function createRuntimeCard(card) {
    return {
        ...card,
        currentHp: card.hp,
        isDefending: false,
        specialCooldown: 0,
        turnsActed: 0, // cuenta los turnos propios que esta carta ha tomado
        consecutiveDefends: 0 // usado por la IA/estrategia automática para no abusar de defender
    };
}

export function createInitialBattleState(playerDeck, machineDeck) {
    const startingSide = Math.random() < 0.5 ? 'player' : 'machine';

    return {
        player: {
            deck: playerDeck.map(createRuntimeCard),
            activeIndex: 0
        },
        machine: {
            deck: machineDeck.map(createRuntimeCard),
            activeIndex: 0
        },
        turn: startingSide,
        status: BATTLE_STATUS.IN_PROGRESS,
        log: []
    };
}

// --- Lectura de estado ---

export function getActiveCard(state, side) {
    const participant = state[side];
    return participant.deck[participant.activeIndex];
}

function getOpponentSide(side) {
    return side === 'player' ? 'machine' : 'player';
}

// Implementa el orden de resolución de daño requerido:
// 1) factor aleatorio de daño -> 2) esquive -> 3) crítico -> 4) reducción por defensa -> 5) redondeo
function resolveDamage(baseDamage, defender) {
    const rawDamage = computeRandomDamage(baseDamage);

    const dodged = Math.random() < DODGE_CHANCE;
    if (dodged) {
        return { damage: 0, dodged: true, critical: false };
    }

    const critical = Math.random() < CRITICAL_CHANCE;
    let damage = critical ? rawDamage * CRITICAL_MULTIPLIER : rawDamage;

    if (defender.isDefending) {
        damage *= defender.defense.damageReduction;
    }

    return { damage: Math.round(damage), dodged: false, critical };
}

// Determina qué acciones puede ejecutar la carta activa de `side` en este momento.
// Usado por la UI (Etapa 7) y por la IA de la máquina (Etapa 8).
export function getAvailableActions(state, side) {
    const card = getActiveCard(state, side);
    const currentTurnNumber = card.turnsActed + 1;

    const specialUnlocked = currentTurnNumber >= card.special.unlockTurn;
    const specialReady = specialUnlocked && card.specialCooldown === 0;

    return {
        attackIds: card.attacks.map((attack) => attack.id),
        canDefend: true,
        canUseSpecial: specialReady
    };
}

// --- Acciones ---

export function performAttack(state, side, attackId) {
    if (state.status !== BATTLE_STATUS.IN_PROGRESS) return state;

    const attacker = getActiveCard(state, side);
    const opponentSide = getOpponentSide(side);
    const defender = getActiveCard(state, opponentSide);

    const attack = attacker.attacks.find((a) => a.id === attackId);
    if (!attack) return state;

    const { damage, dodged, critical } = resolveDamage(attack.baseDamage, defender);

    if (!dodged) {
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        defender.isDefending = false;
    }

    state.log.push({ type: 'attack', side, attackName: attack.name, damage, dodged, critical });

    attacker.turnsActed += 1;
    attacker.consecutiveDefends = 0;
    decreaseCooldown(attacker);

    handleDefeatIfNeeded(state, opponentSide);
    advanceTurn(state);

    return state;
}

export function performDefense(state, side) {
    if (state.status !== BATTLE_STATUS.IN_PROGRESS) return state;

    const card = getActiveCard(state, side);
    card.isDefending = true;

    state.log.push({ type: 'defense', side, defenseName: card.defense.name });

    card.turnsActed += 1;
    card.consecutiveDefends += 1;
    decreaseCooldown(card);

    advanceTurn(state);

    return state;
}

export function performSpecial(state, side) {
    if (state.status !== BATTLE_STATUS.IN_PROGRESS) return state;

    const actions = getAvailableActions(state, side);
    if (!actions.canUseSpecial) return state;

    const attacker = getActiveCard(state, side);
    const opponentSide = getOpponentSide(side);
    const defender = getActiveCard(state, opponentSide);

    const { damage, dodged, critical } = resolveDamage(attacker.special.baseDamage, defender);

    if (!dodged) {
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        defender.isDefending = false;
    }

    state.log.push({ type: 'special', side, specialName: attacker.special.name, damage, dodged, critical });

    attacker.turnsActed += 1;
    attacker.consecutiveDefends = 0;
    attacker.specialCooldown = attacker.special.cooldown;

    handleDefeatIfNeeded(state, opponentSide);
    advanceTurn(state);

    return state;
}

// --- Helpers internos ---

function decreaseCooldown(card) {
    if (card.specialCooldown > 0) {
        card.specialCooldown -= 1;
    }
}

function handleDefeatIfNeeded(state, side) {
    const card = getActiveCard(state, side);
    if (card.currentHp > 0) return;

    state.log.push({ type: 'defeated', side, cardName: card.name });

    const participant = state[side];
    const hasNextCard = participant.activeIndex + 1 < participant.deck.length;

    if (hasNextCard) {
        participant.activeIndex += 1;
        state.log.push({ type: 'card-entered', side, cardName: getActiveCard(state, side).name });
    } else {
        state.status = side === 'player' ? BATTLE_STATUS.MACHINE_WON : BATTLE_STATUS.PLAYER_WON;
    }
}

function advanceTurn(state) {
    if (state.status !== BATTLE_STATUS.IN_PROGRESS) return;
    state.turn = getOpponentSide(state.turn);
}