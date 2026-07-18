import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type { TrustedAuthProfile, TrustedProfileRole, User, UserStatus } from "../types";

interface AuthResult {
  ok: boolean;
  message?: string;
  user?: User;
  error?: unknown;
}

interface RegistrationData {
  email: string;
  password: string;
  metadata: Record<string, string>;
  logoFile?: File | null;
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
  must_change_password: boolean;
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
    accountStatus: row.account_status as UserStatus,
    mustChangePassword: row.must_change_password
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
    mustChangePassword: profile.mustChangePassword,
    createdAt: authUser.created_at
  };
};

const loginErrorMessage = (error: { code?: string; message?: string }) => {
  if (error.code === "invalid_credentials") return "Email ou mot de passe incorrect.";
  if (error.code === "email_not_confirmed") return "Votre adresse email n'a pas encore été confirmée.";
  if (error.message?.toLowerCase().includes("fetch")) return "Impossible de contacter le service. Vérifiez votre connexion internet.";
  return "Une erreur inattendue est survenue pendant la connexion.";
};

const registrationErrorMessage = (error: { code?: string; message?: string; status?: number }) => {
  const message = error.message?.toLowerCase() ?? "";
  if (error.code === "user_already_exists" || message.includes("already registered") || message.includes("already exists")) {
    return "Un compte existe déjà avec cette adresse email.";
  }
  if (error.code === "request_entity_too_large" || error.status === 413) {
    return "Les données envoyées sont trop volumineuses. Veuillez choisir un logo plus léger.";
  }
  if (error.code === "over_email_send_rate_limit" || error.status === 429) {
    return "Trop de demandes ont été envoyées. Veuillez patienter quelques minutes avant de réessayer.";
  }
  if (message.includes("password")) return "Le mot de passe ne respecte pas les exigences de sécurité.";
  if (message.includes("email") && message.includes("invalid")) return "L’adresse e-mail saisie n’est pas valide.";
  if (error.code === "unexpected_failure" || error.status === 500) {
    return "Le service d’inscription n’a pas pu envoyer l’e-mail de confirmation. Veuillez contacter l’administrateur.";
  }
  if (message.includes("fetch") || message.includes("network")) return "Impossible de contacter le service. Vérifiez votre connexion internet.";
  return error.message ? `Supabase a refusé l’inscription : ${error.message}` : "Impossible de créer le compte pour le moment.";
};

const safeStorageName = (fileName: string) => {
  const extension = fileName.toLowerCase().endsWith(".png") ? "png" : "jpg";
  return `logo-${Date.now()}.${extension}`;
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
      .select("id, full_name, email, phone, role, account_status, must_change_password")
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
      const appUser = buildAppUser(trustedProfile, data.user);
      if (trustedProfile.accountStatus !== "active") {
        await supabase.auth.signOut();
        clearAuthState();
        setLoading(false);
        return { ok: true, user: appUser };
      }
      return { ok: true, user: appUser };
    } catch {
      setLoading(false);
      return { ok: false, message: "Impossible de contacter le service. Vérifiez votre connexion internet." };
    }
  }, [clearAuthState, loadTrustedProfile]);

  const register = useCallback(async ({ email, password, metadata, logoFile }: RegistrationData): Promise<AuthResult> => {
    try {
      console.log("REGISTER_STEP", "supabase.auth.signUp");
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: metadata }
      });
      if (error) {
        console.error("REGISTER_SUPABASE_AUTH_ERROR", error);
        return { ok: false, message: registrationErrorMessage(error), error };
      }
      if (!data.user) {
        const missingUserError = new Error("Supabase signUp did not return a user");
        console.error("REGISTER_SUPABASE_AUTH_ERROR", missingUserError);
        return { ok: false, message: "Supabase n’a pas retourné le compte créé. Veuillez réessayer.", error: missingUserError };
      }

      if (!data.session) {
        const missingSessionError = new Error("Supabase signUp did not return a session");
        console.error("REGISTER_SUPABASE_CONFIGURATION_ERROR", missingSessionError);
        return {
          ok: false,
          message: "L’inscription attend encore une confirmation par e-mail. Désactivez « Confirm email » dans la configuration Supabase.",
          error: missingSessionError
        };
      }

      console.log("REGISTER_STEP", "profiles verification");
      const { data: createdProfile, error: profileVerificationError } = await supabase
        .from("profiles")
        .select("id, role, account_status")
        .eq("id", data.user.id)
        .maybeSingle<{ id: string; role: string; account_status: string }>();
      if (profileVerificationError || !createdProfile) {
        console.error("REGISTER_PROFILE_VERIFICATION_ERROR", profileVerificationError);
        await supabase.auth.signOut();
        clearAuthState();
        setLoading(false);
        return { ok: false, message: "Le compte Auth a été créé, mais son profil n’a pas pu être vérifié. Contactez l’administrateur.", error: profileVerificationError };
      }
      if (createdProfile.role !== "teacher" || createdProfile.account_status !== "pending") {
        const invalidProfileError = new Error("Unexpected registration authorization values");
        console.error("REGISTER_PROFILE_AUTHORIZATION_ERROR", invalidProfileError, createdProfile);
        await supabase.auth.signOut();
        clearAuthState();
        setLoading(false);
        return { ok: false, message: "Le profil créé ne respecte pas les règles d’autorisation. Contactez l’administrateur.", error: invalidProfileError };
      }

      let logoMessage: string | undefined;
      if (logoFile) {
        console.log("REGISTER_STEP", "teacher-logos upload");
        const logoPath = `${data.user.id}/${safeStorageName(logoFile.name)}`;
        const { error: uploadError } = await supabase.storage.from("teacher-logos").upload(logoPath, logoFile, {
          contentType: logoFile.type,
          upsert: false
        });
        if (uploadError) {
          console.error("REGISTER_LOGO_UPLOAD_ERROR", uploadError);
          logoMessage = "Le compte a été créé, mais le logo n’a pas pu être enregistré. Vous pourrez l’ajouter plus tard.";
        } else {
          console.log("REGISTER_STEP", "profiles avatar_path update");
          const { error: profileError } = await supabase.from("profiles").update({ avatar_path: logoPath }).eq("id", data.user.id);
          if (profileError) {
            console.error("REGISTER_PROFILE_UPDATE_ERROR", profileError);
            logoMessage = "Le compte et le logo ont été créés, mais le profil n’a pas pu être associé au logo.";
          }
        }
      }
      await supabase.auth.signOut();
      clearAuthState();
      setLoading(false);
      return { ok: true, message: logoMessage ?? "Votre demande a été enregistrée et attend la validation de l’administrateur." };
    } catch (error) {
      console.error("REGISTER_SUPABASE_UNEXPECTED_ERROR", error);
      return { ok: false, message: registrationErrorMessage(error instanceof Error ? error : {}), error };
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
