// adminsApi.js
// Validación de credenciales del panel administrativo

import { apiRequest } from './apiConfig.js';

export async function validateAdminCredentials(username, password) {
    const admins = await apiRequest(
        `/admins?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    );
    return admins.length > 0 ? admins[0] : null;
}