import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, isNetworkError, setUnauthorizedHandler, type User } from '../lib/api';
import { AuthContext, type AuthMode, type AuthStatus, type Credentials } from './authContext';

/**
 * Session state for the whole app. The session itself lives in an HttpOnly cookie managed by the browser and the
 * server; this provider only asks the API "who am I?" (GET /users/me) and mirrors the answer in React state.
 */
export default function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const statusRef = useRef<AuthStatus>('loading');
  statusRef.current = status;

  const signOut = useCallback(async () => {
    statusRef.current = 'signedOut';
    setUser(null);
    setStatus('signedOut');
    try {
      await api.post('/auth/logout'); // asks the server to clear the HttpOnly cookie
    } catch {
      /* already signed out locally; the cookie expires on its own */
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // A late 401 (e.g. a request that started after the user already signed out) must not show "session expired".
      if (statusRef.current !== 'signedIn') return;
      setSessionExpired(true);
      statusRef.current = 'signedOut';
      setUser(null);
      setStatus('signedOut');
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  useEffect(() => {
    let alive = true;
    setStatus('loading');
    api
      .get<User>('/users/me')
      .then(res => {
        if (!alive) return;
        setUser(res.data);
        setStatus('signedIn');
      })
      .catch(e => {
        if (!alive) return;
        // 401 just means "no session yet"; anything without a response means the API is down.
        setStatus(isNetworkError(e) ? 'unreachable' : 'signedOut');
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const signIn = useCallback(async (mode: AuthMode, creds: Credentials) => {
    const body =
      mode === 'register'
        ? { username: creds.username?.trim(), displayName: creds.displayName?.trim(), email: creds.email.trim(), password: creds.password }
        : { email: creds.email.trim(), password: creds.password };
    const res = await api.post<{ user: User }>(`/auth/${mode}`, body);
    setUser(res.data.user);
    setSessionExpired(false);
    setStatus('signedIn');
  }, []);

  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const value = useMemo(
    () => ({ status, user, sessionExpired, signIn, signOut, updateUser: setUser, retry }),
    [status, user, sessionExpired, signIn, signOut, retry],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
