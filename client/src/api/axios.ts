import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// In-memory access token only - NEVER localStorage/sessionStorage, which are
// readable by any injected script (XSS). The refresh token lives in an
// httpOnly cookie the browser attaches automatically and JS can't touch.
let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post(
      `${BASE_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    setAccessToken(data.accessToken);
    return data.accessToken as string;
  } catch {
    setAccessToken(null);
    return null;
  }
}

// SESSION REPLACEMENT: dispatched whenever the server tells us this
// specific session was revoked because the user logged in elsewhere.
// AuthContext listens for this to log the user out and show a message.
export const SESSION_REPLACED_EVENT = 'auth:session-replaced';

// On a 401, try exactly one silent refresh-and-retry. Concurrent 401s share
// a single in-flight refresh call instead of hammering the endpoint.
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string }>) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // A replaced/revoked session is never worth retrying via refresh - the
    // refresh cookie for it was revoked too. Fail fast and notify the app.
    if (error.response?.status === 401 && error.response.data?.code === 'SESSION_REPLACED') {
      setAccessToken(null);
      window.dispatchEvent(
        new CustomEvent(SESSION_REPLACED_EVENT, { detail: error.response.data })
      );
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshPromise) refreshPromise = refreshAccessToken();
      const newToken = await refreshPromise;
      refreshPromise = null;

      if (newToken) {
        original.headers = original.headers ?? {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

export default api;