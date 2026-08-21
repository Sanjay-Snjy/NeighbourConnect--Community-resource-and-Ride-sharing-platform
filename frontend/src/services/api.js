import axios from "axios";
import { clearToken, getToken } from "@/lib/authToken";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ||
  "http://localhost:8000/api";

/** Shared Axios instance. Token auth via the `Authorization` header. */
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { Accept: "application/json" },
  timeout: 20000,
});

// Attach the auth token (Django REST Framework TokenAuthentication).
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  // Let the browser set multipart boundaries for FormData bodies.
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

// Listeners notified when the session becomes invalid (401).
const unauthorizedHandlers = new Set();
export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}

/**
 * Normalize any backend/network error into a friendly, displayable shape:
 *   { message, fieldErrors, status }
 * The Django exception handler returns { detail, errors }.
 */
export function parseApiError(error) {
  if (axios.isCancel?.(error) || error?.code === "ERR_CANCELED") {
    return { message: "", fieldErrors: {}, status: 0, canceled: true };
  }

  if (!error?.response) {
    return {
      message:
        "We couldn't reach the server. Check your connection and try again.",
      fieldErrors: {},
      status: 0,
    };
  }

  const { status, data } = error.response;
  const fieldErrors = {};
  let message = "";

  if (data && typeof data === "object") {
    if (typeof data.detail === "string") {
      message = data.detail;
    }
    const errors = data.errors ?? data;
    if (errors && typeof errors === "object") {
      for (const [key, value] of Object.entries(errors)) {
        if (key === "detail") continue;
        const text = Array.isArray(value) ? value.join(" ") : String(value);
        fieldErrors[key] = text;
        if (!message && key === "non_field_errors") message = text;
      }
    }
  } else if (typeof data === "string" && data.length < 200) {
    message = data;
  }

  if (!message) {
    message =
      status >= 500
        ? "Something went wrong on our end. Please try again shortly."
        : status === 404
          ? "We couldn't find what you were looking for."
          : status === 403
            ? "You don't have permission to do that."
            : Object.values(fieldErrors)[0] ||
              "Something went wrong. Please try again.";
  }

  return { message, fieldErrors, status };
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || "";
    // Ignore 401s from the login/register probes — those are handled inline.
    const isAuthProbe = url.includes("/auth/login") || url.includes("/auth/register");
    if (status === 401 && !isAuthProbe) {
      clearToken();
      unauthorizedHandlers.forEach((handler) => handler());
    }
    return Promise.reject(error);
  },
);

export default api;
