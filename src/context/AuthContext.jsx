import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "../services/authService";
import { tokenStore } from "../lib/tokenStore";
import { unregisterPush, resumePushSession } from '../services/nativeNotifications';
import VistaProcessing from '../components/common/VistaProcessing';
import { queryClient } from "../lib/queryClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(null);
  const [authProcess, setAuthProcess] = useState(null);

  const restoreSession = useCallback(async () => {
    setIsRestoring(true);
    setRestoreError(null);
    let tokensLoaded = false;

    try {
      const storedTokens = await tokenStore.loadTokens();
      tokensLoaded = true;
      if (!storedTokens.access && !storedTokens.refresh) return;

      const currentUser = await authService.me();
      setUser(currentUser);
      setRole(currentUser?.role ?? null);
      setTokens(tokenStore.getTokens());
    } catch (error) {
      let restoreFailure = error;
      if (
        error.status === 401 &&
        !tokenStore.getRefreshToken() &&
        tokenStore.getAccessToken()
      ) {
        try {
          await tokenStore.clear();
        } catch (clearError) {
          restoreFailure = clearError;
        }
      }

      if (
        tokensLoaded &&
        !tokenStore.getAccessToken() &&
        !tokenStore.getRefreshToken() &&
        restoreFailure === error
      ) {
        setRestoreError(null);
      } else {
        setRestoreError(restoreFailure);
      }
    } finally {
      setIsRestoring(false);
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
      }
    });
    return unsubscribe;
  }, []);

  const login = async ({ email, password }) => {
    setAuthProcess('Signing in…');
    try {
      // Drain/unbind the prior account before replacing its authentication tokens.
      if (user) await unregisterPush();
      queryClient.cancelQueries();
      queryClient.clear();
      const data = await authService.login({ email, password });
      await tokenStore.setTokens(data.tokens);
      setUser({ ...data.user, is_first_login: !!data.is_first_login });
      setRole(data.user?.role ?? null);
      setTokens(tokenStore.getTokens());
      return data;
    } catch (error) {
      if (user) resumePushSession(user.user_id);
      throw error;
    } finally { setAuthProcess(null); }
  };

  const logout = async () => {
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
    setUser((prev) => ({ ...prev, ...newData }));
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
