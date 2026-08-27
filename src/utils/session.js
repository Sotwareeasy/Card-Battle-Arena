// session.js
// Persiste la sesión activa (jugador o admin) en localStorage para que
// sobreviva a un refresco/recarga de la página (F5, Ctrl+R, cerrar y
// volver a abrir la pestaña). No guarda contraseñas: solo el objeto de
// jugador/admin que ya devuelve la API tras un login o registro exitoso.

const SESSION_KEY = 'cba-session';

// type: 'player' | 'admin'
export function saveSession(type, data) {
    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ type, data }));
    } catch (error) {
        console.warn('No se pudo guardar la sesión en localStorage:', error);
    }
}

// Devuelve { type, data } o null si no hay sesión guardada / está corrupta.
export function loadSession() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch (error) {
        console.warn('No se pudo leer la sesión guardada, se descarta:', error);
        return null;
    }
}

export function clearSession() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.warn('No se pudo limpiar la sesión guardada:', error);
    }
}