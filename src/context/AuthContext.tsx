import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { TrustedAuthProfile, TrustedProfileRole, User, UserStatus } from "../types";

interface AuthResult {
  ok: boolean;
  message?: string;
  user?: User;
}

interface RegistrationData {
  email: string;
  password: string;
  metadata: Record<string, string>;
}

interface AuthContextValue {
  session: Session | null;
  authUser: SupabaseUser | null;
  user: User | null;
  profile: TrustedAuthProfile | null;
  loading: boolean;
  profileUnavailable: boolean;
  isRecoverySession: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (data: RegistrationData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => void;
}

type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  account_status: string;
};

const validRoles: TrustedProfileRole[] = ["platform_admin", "teacher"];
const validStatuses: UserStatus[] = ["pending", "active", "suspended", "rejected"];
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const safeProfile = (row: ProfileRow): TrustedAuthProfile | null => {
  if (!validRoles.includes(row.role as TrustedProfileRole) || !validStatuses.includes(row.account_status as UserStatus)) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    role: row.role as TrustedProfileRole,
    accountStatus: row.account_status as UserStatus
  };
};

const buildAppUser = (profile: TrustedAuthProfile, authUser: SupabaseUser): User => {
  const metadata = authUser.user_metadata;
  return {
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone ?? "",
    schoolName: typeof metadata.school_name === "string" ? metadata.school_name : "",
    city: typeof metadata.city === "string" ? metadata.city : "",
    schoolLevel: typeof metadata.school_level === "string" ? metadata.school_level : undefined,
    schoolSubject: typeof metadata.school_subject === "string" ? metadata.school_subject : undefined,
    logo: typeof metadata.logo_data_url === "string" ? metadata.logo_data_url : undefined,
    role: profile.role,
    status: profile.accountStatus,
    createdAt: authUser.created_at
  };
};

const loginErrorMessage = (error: { code?: string; message?: string }) => {
  if (error.code === "invalid_credentials") return "Email ou mot de passe incorrect.";
  if (error.code === "email_not_confirmed") return "Votre adresse email n'a pas encore été confirmée.";
  if (error.message?.toLowerCase().includes("fetch")) return "Impossible de contacter le service. Vérifiez votre connexion internet.";
  return "Une erreur inattendue est survenue pendant la connexion.";
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authUser, setAuthUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<TrustedAuthProfile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileUnavailable, setProfileUnavailable] = useState(false);
  const [isRecoverySession, setIsRecoverySession] = useState(() => window.location.hash.includes("type=recovery") || window.location.search.includes("type=recovery"));
  const requestId = useRef(0);

  const clearAuthState = useCallback(() => {
    requestId.current += 1;
    setSession(null);
    setAuthUser(null);
    setProfile(null);
    setUser(null);
    setProfileUnavailable(false);
    setIsRecoverySession(false);
  }, []);

  const loadTrustedProfile = useCallback(async (nextSession: Session) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setProfileUnavailable(false);
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (currentRequest !== requestId.current) return null;
    if (userError || !userData.user || userData.user.id !== nextSession.user.id) {
      setAuthUser(null);
      setProfile(null);
      setUser(null);
      setProfileUnavailable(true);
      setLoading(false);
      return null;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, role, account_status")
      .eq("id", userData.user.id)
      .maybeSingle<ProfileRow>();
    if (currentRequest !== requestId.current) return null;
    const trustedProfile = !error && data ? safeProfile(data) : null;
    setSession(nextSession);
    setAuthUser(userData.user);
    setProfile(trustedProfile);
    setUser(trustedProfile ? buildAppUser(trustedProfile, userData.user) : null);
    setProfileUnavailable(!trustedProfile);
    setLoading(false);
    return trustedProfile;
  }, []);

  useEffect(() => {
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY") setIsRecoverySession(true);
      if (!nextSession) {
        clearAuthState();
        setLoading(false);
        return;
      }
      setSession(nextSession);
      window.setTimeout(() => { if (mounted) void loadTrustedProfile(nextSession); }, 0);
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error || !data.session) {
        clearAuthState();
        setLoading(false);
        return;
      }
      setSession(data.session);
      void loadTrustedProfile(data.session);
    });

    return () => {
      mounted = false;
      requestId.current += 1;
      listener.subscription.unsubscribe();
    };
  }, [clearAuthState, loadTrustedProfile]);

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error || !data.session) {
        setLoading(false);
        return { ok: false, message: loginErrorMessage(error ?? {}) };
      }
      const trustedProfile = await loadTrustedProfile(data.session);
      if (!trustedProfile) return { ok: false, message: "Ce compte n'est pas autorisé à accéder à l'application." };
      return { ok: true, user: buildAppUser(trustedProfile, data.user) };
    } catch {
      setLoading(false);
      return { ok: false, message: "Impossible de contacter le service. Vérifiez votre connexion internet." };
    }
  }, [loadTrustedProfile]);

  const register = useCallback(async ({ email, password, metadata }: RegistrationData): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: metadata, emailRedirectTo: `${window.location.origin}/account-pending` }
      });
      if (error) {
        if (error.code === "user_already_exists") return { ok: false, message: "Un compte existe déjà avec cette adresse email." };
        if (error.message.toLowerCase().includes("password")) return { ok: false, message: "Le mot de passe doit contenir au moins 8 caractères." };
        if (error.message.toLowerCase().includes("fetch")) return { ok: false, message: "Impossible de contacter le service. Vérifiez votre connexion internet." };
        return { ok: false, message: "Impossible de créer le compte pour le moment." };
      }
      await supabase.auth.signOut();
      clearAuthState();
      setLoading(false);
      return { ok: true };
    } catch {
      return { ok: false, message: "Impossible de contacter le service. Vérifiez votre connexion internet." };
    }
  }, [clearAuthState]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearAuthState();
    setLoading(false);
  }, [clearAuthState]);

  const updateProfile = useCallback((data: Partial<User>) => setUser((current) => current ? { ...current, ...data } : current), []);

  const value = useMemo(() => ({ session, authUser, user, profile, loading, profileUnavailable, isRecoverySession, login, register, logout, updateProfile }), [session, authUser, user, profile, loading, profileUnavailable, isRecoverySession, login, register, logout, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
