/**
 * Centralized API URL helper
 * Uses import.meta.env.VITE_API_URL if configured, otherwise falls back to relative paths.
 */
export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export function apiUrl(endpoint = '') {
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_URL}${path}`;
}

export default API_URL;
