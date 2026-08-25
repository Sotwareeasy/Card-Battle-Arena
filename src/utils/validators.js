// validators.js
// Funciones puras de validación, reutilizables en todo el proyecto.

export function validateNickname(nickname) {
    const trimmed = (nickname || '').trim();

    if (!trimmed) {
        return { valid: false, message: 'El nickname no puede estar vacío.' };
    }

    if (trimmed.length < 3) {
        return { valid: false, message: 'El nickname debe tener al menos 3 caracteres.' };
    }

    if (trimmed.length > 20) {
        return { valid: false, message: 'El nickname no puede superar los 20 caracteres.' };
    }

    const allowedPattern = /^[a-zA-Z0-9_]+$/;
    if (!allowedPattern.test(trimmed)) {
        return { valid: false, message: 'Solo se permiten letras, números y guion bajo (_).' };
    }

    return { valid: true, value: trimmed };
}

export function validatePassword(password) {
    const value = password || '';

    if (!value) {
        return { valid: false, message: 'La contraseña no puede estar vacía.' };
    }

    if (value.length < 4) {
        return { valid: false, message: 'La contraseña debe tener al menos 4 caracteres.' };
    }

    if (value.length > 30) {
        return { valid: false, message: 'La contraseña no puede superar los 30 caracteres.' };
    }

    return { valid: true, value };
}