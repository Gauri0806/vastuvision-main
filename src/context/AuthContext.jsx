import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

const TOKEN_KEY = 'vv_token';
const USER_KEY  = 'vv_user';

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function getSavedUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // ── Initialise directly from localStorage so first render is correct ──
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user,  setUser]  = useState(() => getSavedUser());
  // loading = false immediately if no token (no verify needed)
  const [loading, setLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY));

  // Track the token that was present when verify started, so stale
  // verify responses can't clear a freshly-issued login token.
  const verifyingToken = useRef(null);

  // ── On mount: silently verify stored token in the background ─────────
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    verifyingToken.current = savedToken;

    authAPI.getMe()
      .then(({ data }) => {
        // Only update if the token we verified is STILL the active one.
        // If the user logged in/registered during this verify, their new
        // token takes precedence — don't overwrite it.
        if (localStorage.getItem(TOKEN_KEY) === verifyingToken.current) {
          const freshUser = data.user || data;
          setUser(freshUser);
          localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
        }
      })
      .catch((err) => {
        // Only clear session if:
        //  1. The server explicitly says token is invalid (401)
        //  2. The token hasn't been replaced by a fresh login
        const stillSameToken = localStorage.getItem(TOKEN_KEY) === verifyingToken.current;
        if (stillSameToken && err.response?.status === 401) {
          clearSession();
          setToken(null);
          setUser(null);
        }
        // Network errors / 5xx → keep local session (offline mode)
      })
      .finally(() => setLoading(false));
  }, []);

  // ── login ─────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login({ email, password });
    const { token: jwt, user: userData } = data;
    // Write localStorage BEFORE setting state so ProtectedRoute
    // can read it even if React batching delays the state update
    saveSession(jwt, userData);
    verifyingToken.current = null; // invalidate any pending verify
    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  // ── register ──────────────────────────────────────────────
  const register = useCallback(async (name, email, password) => {
    const { data } = await authAPI.register({ name, email, password });
    const { token: jwt, user: userData } = data;
    saveSession(jwt, userData);
    verifyingToken.current = null;
    setToken(jwt);
    setUser(userData);
    return userData;
  }, []);

  // ── logout ────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession();
    verifyingToken.current = null;
    setToken(null);
    setUser(null);
  }, []);

  // ── updateUser ────────────────────────────────────────────
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, isAuthenticated, loading, login, register, logout, updateUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
