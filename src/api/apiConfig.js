// apiConfig.js
// Resuelve la URL base de la API según el modo definido en .env
// Development -> JSON Server local
// Production  -> API real (a definir en la Etapa 15 - Deploy)

function resolveBaseUrl() {
    switch (import.meta.env.VITE_API_MODE) {
        case 'production':
            return import.meta.env.VITE_API_PROD_URL;
        case 'development':
        default:
            return import.meta.env.VITE_API_DEV_URL;
    }
}

export const API_BASE_URL = resolveBaseUrl();

// Helper central para todas las peticiones fetch del proyecto.
// Centraliza el manejo de errores HTTP para no repetirlo en cada archivo *Api.js
export async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });

    if (!response.ok) {
        throw new Error(`Error ${response.status} en ${url}`);
    }

    // DELETE en JSON Server a veces responde sin body
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') return null;

    return response.json();
}