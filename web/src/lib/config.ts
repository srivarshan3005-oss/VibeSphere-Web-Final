const DEFAULT_API_URL = 'http://localhost:8080/api';

/** The one place the API address is decided. Override it in web/.env (see .env.example). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');

/** Server origin (scheme + host + port) used to resolve relative media paths such as /api/uploads/x.jpg. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api$/, '');

export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  return url.startsWith('/') ? API_ORIGIN + url : url;
}

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
