import { createContext, useContext } from 'react';
import type { User } from '../lib/api';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn' | 'unreachable';
export type AuthMode = 'login' | 'register';
export type Credentials = { email: string; password: string; username?: string; displayName?: string };

export type AuthCtx = {
  status: AuthStatus;
  user: User | null;
  /** Set when the server rejected our session, so the sign-in page can explain why the user was signed out. */
  sessionExpired: boolean;
  signIn: (mode: AuthMode, creds: Credentials) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (u: User) => void;
  /** Re-check the session (used by the "try again" button when the API was unreachable). */
  retry: () => void;
};

export const AuthContext = createContext<AuthCtx | null>(null);

export function useAuth(): AuthCtx {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}
