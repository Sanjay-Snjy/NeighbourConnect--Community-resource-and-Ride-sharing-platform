/**
 * Tiny persisted holder for the auth token, kept separate from the Zustand
 * store so the Axios layer can read/clear it without a circular import.
 */
const STORAGE_KEY = "neighbourhub.token";

let token = null;
try {
  token = localStorage.getItem(STORAGE_KEY);
} catch {
  token = null;
}

export function getToken() {
  return token;
}

export function setToken(value) {
  token = value || null;
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable (private mode) — keep in memory only */
  }
}

export function clearToken() {
  setToken(null);
}
