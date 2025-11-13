import type { Usuario } from "@shared/schema";

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
}

const AUTH_STORAGE_KEY = "app_ipe_auth";

export function getAuthState(): AuthState {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return { usuario: null, token: null };
  
  try {
    return JSON.parse(stored);
  } catch {
    return { usuario: null, token: null };
  }
}

export function setAuthState(usuario: Usuario, token: string): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ usuario, token }));
}

export function clearAuthState(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function isProprietario(usuario: Usuario | null): boolean {
  return usuario?.papel === "Proprietário";
}

export function isComprador(usuario: Usuario | null): boolean {
  return usuario?.papel === "Comprador";
}

export function getAuthToken(): string | null {
  const state = getAuthState();
  return state.token;
}
