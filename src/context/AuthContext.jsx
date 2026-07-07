import { createContext, useContext, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [tokens, setTokens] = useState(null);

  const login = async ({ email, password }) => {
    const data = await authService.login({ email, password });
    setUser(data.user);
    setRole(data.user?.role ?? null);
    setTokens(data.tokens);
    return data;
  };

  const logout = async () => {
    const currentTokens = tokens;
    setUser(null);
    setRole(null);
    setTokens(null);

    if (currentTokens?.refresh && currentTokens?.access) {
      try {
        await authService.logout({
          refresh: currentTokens.refresh,
          accessToken: currentTokens.access,
        });
      } catch {
        // Local logout should still complete if the token is expired or offline.
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, tokens, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);