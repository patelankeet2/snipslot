import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '../api/auth';
import { NetworkError, UNAUTHORIZED_EVENT } from '../api/client';
import type { User } from '../types';
import { AuthContext } from './authContextValue';

// Only the public profile is remembered (never the token, that lives in an
// httpOnly cookie) so the app can still open while offline.
const STORAGE_KEY = 'snipslot:user';

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function cacheUser(user: User | null) {
  try {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage can be blocked in private mode, the app still works without it
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = useCallback((next: User | null) => {
    setUser(next);
    cacheUser(next);
  }, []);

  // On start up ask the API who we are. If we are offline, trust the cached profile.
  useEffect(() => {
    authApi
      .me()
      .then(updateUser)
      .catch((err) => {
        if (err instanceof NetworkError) setUser(readCachedUser());
        else updateUser(null);
      })
      .finally(() => setLoading(false));
  }, [updateUser]);

  // any 401 from the API means the session is over
  useEffect(() => {
    const onUnauthorized = () => updateUser(null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [updateUser]);

  const signIn = useCallback(
    async (credential: string) => {
      const signedIn = await authApi.loginWithGoogle(credential);
      updateUser(signedIn);
      return signedIn;
    },
    [updateUser],
  );

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      window.google?.accounts.id.disableAutoSelect();
      updateUser(null);
    }
  }, [updateUser]);

  const value = useMemo(
    () => ({ user, loading, signIn, signOut }),
    [user, loading, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
