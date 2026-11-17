import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { authService } from "../services/authService";
import { tokenStore } from "../lib/tokenStore";
import { unregisterPush, resumePushSession } from '../services/nativeNotifications';
import VistaProcessing from '../components/common/VistaProcessing';
import { queryClient } from "../lib/queryClient";
import { connectivity, isConnectionError } from '../lib/connectivityState.cjs';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(null);
  const [authProcess, setAuthProcess] = useState(null);
  const sessionRevision = useRef(0);
  const currentUserRef = useRef(null);
  currentUserRef.current = user;
  const rememberUser = async (profile) => {
    try { await tokenStore.saveCachedUser?.(profile); }
    catch { /* Online access still works if the optional offline cache cannot be written. */ }
  };

  const restoreSession = useCallback(async () => {
    const revision = ++sessionRevision.current;
    const current = () => revision === sessionRevision.current;
    setIsRestoring(!currentUserRef.current);
    setRestoreError(null);
    let tokensLoaded = false;

    try {
      const storedTokens = await tokenStore.loadTokens();
      if (!current()) return;
      tokensLoaded = true;
      if (!storedTokens.access && !storedTokens.refresh) return;

      // A verified profile bound to these saved credentials opens the bundled
      // interface immediately. Server checks still govern all online operations.
      const cached = tokenStore.getCachedUser?.();
      if (cached) {
        setUser(cached); setRole(cached.role); setTokens(storedTokens);
        setIsRestoring(false);
      }

      const currentUser = await authService.me();
      if (!current()) return;
      if (cached && (cached.user_id !== currentUser.user_id || cached.role !== currentUser.role)) {
        await queryClient.cancelQueries(); queryClient.clear();
      }
      await rememberUser(currentUser);
      if (!current()) return;
      setUser(currentUser);
      setRole(currentUser?.role ?? null);
      setTokens(tokenStore.getTokens());
    } catch (error) {
      if (!current()) return;
      const cached = tokenStore.getCachedUser?.();
      if (cached && (isConnectionError(error) || error.status >= 500)) {
        setRestoreError(null);
        return;
      }
      if ([401, 403].includes(error.status)) {
        await queryClient.cancelQueries(); queryClient.clear();
        setUser(null); setRole(null); setTokens(null);
        try { await tokenStore.clear(); }
        catch (clearError) { if (current()) setRestoreError(clearError); }
        return;
      }
      if (
        tokensLoaded &&
        !tokenStore.getAccessToken() &&
        !tokenStore.getRefreshToken()
      ) {
        setRestoreError(null);
      } else {
        setRestoreError(error);
      }
    } finally {
      if (current()) setIsRestoring(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  useEffect(() => {
    const unsubscribe = tokenStore.subscribe(() => {
      const currentTokens = tokenStore.getTokens();
      if (!currentTokens.access && !currentTokens.refresh) {
        queryClient.cancelQueries();
        queryClient.clear();
        setUser(null);
        setRole(null);
        setTokens(null);
        sessionRevision.current++;
        setIsRestoring(false);
        setRestoreError(null);
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => connectivity.subscribe(online => {
    if (online && (tokenStore.getAccessToken() || tokenStore.getRefreshToken())) restoreSession();
  }), [restoreSession]);

  useEffect(() => () => { sessionRevision.current++; }, []);

  const login = async ({ email, password }) => {
    sessionRevision.current++;
    setAuthProcess('Signing in…');
    try {
      // Drain/unbind the prior account before replacing its authentication tokens.
      if (user) await unregisterPush();
      queryClient.cancelQueries();
      queryClient.clear();
      const data = await authService.login({ email, password });
      await tokenStore.setTokens(data.tokens);
      const profile = { ...data.user, is_first_login: !!data.is_first_login };
      await rememberUser(profile);
      setUser(profile);
      setRole(data.user?.role ?? null);
      setTokens(tokenStore.getTokens());
      return data;
    } catch (error) {
      if (user) resumePushSession(user.user_id);
      throw error;
    } finally { setAuthProcess(null); }
  };

  const logout = async () => {
    sessionRevision.current++;
    setAuthProcess('Signing out…');
    try {
      try {
        await unregisterPush();
      } catch (error) {
        resumePushSession(user?.user_id);
        throw new Error('Could not securely sign out. Reconnect to the internet and try again.');
      }
      const refresh = tokenStore.getRefreshToken() ?? tokens?.refresh;

      try {
        if (refresh) {
          await authService.logout({ refresh });
        }
      } catch {
        // Local logout should still complete if the token is expired or offline.
      } finally {
        queryClient.cancelQueries();
        queryClient.clear();
        setUser(null);
        setRole(null);
        setTokens(null);
        await tokenStore.clear();
      }
    } finally { setAuthProcess(null); }
  };

  const updateUser = useCallback((newData) => {
    const profile = { ...currentUserRef.current, ...newData };
    currentUserRef.current = profile;
    setUser(profile);
    rememberUser(profile);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        tokens,
        isRestoring,
        restoreError,
        retryRestore: restoreSession,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
      <VistaProcessing visible={!!authProcess} auth message={authProcess || ''} />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
