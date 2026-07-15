import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { clearSession, ensureSeedData, getSessionId, getUsers, saveUsers, setSessionId } from "../lib/storage";
import type { User } from "../types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => { ok: boolean; message?: string; user?: User };
  logout: () => void;
  register: (user: User) => void;
  updateProfile: (data: Partial<User>) => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(() => {
    const id = getSessionId();
    const nextUser = getUsers().find((item) => item.id === id) ?? null;
    if (nextUser?.role === "client" && nextUser.status !== "active") {
      clearSession();
      setUser(null);
      return;
    }
    setUser(nextUser);
  }, []);

  useEffect(() => {
    ensureSeedData();
    refreshUser();
    const timer = window.setTimeout(() => setLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  const login = useCallback((email: string, password: string) => {
    const found = getUsers().find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password);
    if (!found) return { ok: false, message: "Email ou mot de passe incorrect." };
    if (found.role === "client" && found.status === "pending") return { ok: false, message: "Votre compte est en cours de traitement." };
    if (found.role === "client" && found.status === "suspended") return { ok: false, message: "Votre compte est suspendu. Contactez l'administrateur." };
    setSessionId(found.id);
    setUser(found);
    return { ok: true, user: found };
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const register = useCallback((newUser: User) => {
    saveUsers([...getUsers(), newUser]);
  }, []);

  const updateProfile = useCallback((data: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...data };
      saveUsers(getUsers().map((item) => (item.id === current.id ? updated : item)));
      return updated;
    });
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, register, updateProfile, refreshUser }), [user, loading, login, logout, register, updateProfile, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
