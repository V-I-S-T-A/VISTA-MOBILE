import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { authService } from "../services/authService";
import { tokenStore } from "../lib/tokenStore";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const [restoreError, setRestoreError] = useState(null);

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

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    await tokenStore.setTokens(data.tokens);
    setUser(data.user);
    setRole(data.user?.role ?? null);
    setTokens(tokenStore.getTokens());
    return data;
  };

  const logout = async () => {
    const refresh = tokenStore.getRefreshToken() ?? tokens?.refresh;

    try {
      if (refresh) {
        await authService.logout({ refresh });
      }
    } catch {
      // Local logout should still complete if the token is expired or offline.
    } finally {
      setUser(null);
      setRole(null);
      setTokens(null);
      await tokenStore.clear();
    }
  };

  const updateUser = (newData) => {
    setUser((prev) => ({ ...prev, ...newData }));
  };

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
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
