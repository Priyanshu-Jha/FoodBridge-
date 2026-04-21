const normalizeBaseUrl = (value) => String(value || '').replace(/\/+$/, '');

const defaultApiBase = 'http://localhost:8080';

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL || defaultApiBase);
export const WS_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_WS_BASE_URL || `${API_BASE_URL}/ws`);

export const apiUrl = (path) => {
    if (!path) {
        return API_BASE_URL;
    }

    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};
