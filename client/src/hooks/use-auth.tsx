import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Usuario } from "@shared/schema";
import { getAuthState, setAuthState, clearAuthState } from "@/lib/auth";

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (usuario: Usuario, token: string) => void;
  logout: () => void;
  isProprietario: boolean;
  isComprador: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const state = getAuthState();
    setUsuario(state.usuario);
    setToken(state.token);
  }, []);

  const login = (newUsuario: Usuario, newToken: string) => {
    setUsuario(newUsuario);
    setToken(newToken);
    setAuthState(newUsuario, newToken);
  };

  const logout = () => {
    setUsuario(null);
    setToken(null);
    clearAuthState();
  };

  const value: AuthContextType = {
    usuario,
    token,
    login,
    logout,
    isProprietario: usuario?.papel === "Proprietário",
    isComprador: usuario?.papel === "Comprador",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
