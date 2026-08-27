// session.js
// Persiste la sesión activa (jugador y/o admin) en localStorage para que
// sobreviva a un refresco/recarga de la página (F5, Ctrl+R, cerrar y
// volver a abrir la pestaña). No guarda contraseñas: solo el objeto de
// jugador/admin que ya devuelve la API tras un login o registro exitoso.
//
// Jugador y admin usan LLAVES INDEPENDIENTES en localStorage, para que
// cerrar sesión de uno nunca borre al otro (ej. un jugador que entra al
// panel admin y luego solo cierra el admin debe seguir logueado como
// jugador tras refrescar la página).

const SESSION_KEYS = {
    player: 'cba-session-player',
    admin: 'cba-session-admin'
};

// type: 'player' | 'admin'
export function saveSession(type, data) {
    const key = SESSION_KEYS[type];
    if (!key) return;
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.warn('No se pudo guardar la sesión en localStorage:', error);
    }
}

// Devuelve los datos guardados de ese tipo, o null si no hay nada / está corrupto.
export function loadSession(type) {
    const key = SESSION_KEYS[type];
    if (!key) return null;
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn('No se pudo leer la sesión guardada, se descarta:', error);
        return null;
    }
}

// Si se omite `type`, limpia AMBAS sesiones (usado por el "Cerrar sesión"
// general, que sí debe terminar toda la sesión activa en la pestaña).
export function clearSession(type) {
    try {
        if (!type) {
            Object.values(SESSION_KEYS).forEach((key) => localStorage.removeItem(key));
            return;
        }
        const key = SESSION_KEYS[type];
        if (key) localStorage.removeItem(key);
    } catch (error) {
        console.warn('No se pudo limpiar la sesión guardada:', error);
    }
}