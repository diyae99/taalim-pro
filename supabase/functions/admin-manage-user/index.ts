import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type AdminAction = "activate_user" | "generate_temporary_password";

interface RequestBody {
  action?: AdminAction;
  userId?: string;
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const secureIndex = (length: number) => {
  const maximum = Math.floor(0x100000000 / length) * length;
  const value = new Uint32Array(1);
  do crypto.getRandomValues(value); while (value[0] >= maximum);
  return value[0] % length;
};

const randomCharacter = (characters: string) => characters[secureIndex(characters.length)];

const generateTemporaryPassword = (length = 16) => {
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%*-_=+?";
  const all = `${uppercase}${lowercase}${digits}${special}`;
  const characters = [
    randomCharacter(uppercase),
    randomCharacter(lowercase),
    randomCharacter(digits),
    randomCharacter(special),
  ];

  while (characters.length < Math.max(length, 14)) characters.push(randomCharacter(all));
  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = secureIndex(index + 1);
    [characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]];
  }
  return characters.join("");
};

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return jsonResponse({ error: "Méthode non autorisée." }, 405);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return jsonResponse({ error: "Authentification requise." }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return jsonResponse({ error: "Configuration serveur incomplète." }, 500);

  try {
    const token = authorization.slice("Bearer ".length);
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });

    const { data: authData, error: authError } = await adminClient.auth.getUser(token);
    if (authError || !authData.user) return jsonResponse({ error: "Session administrateur invalide." }, 401);

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from("profiles")
      .select("role, account_status")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (adminProfileError) return jsonResponse({ error: "Impossible de vérifier les autorisations." }, 500);
    if (adminProfile?.role !== "platform_admin" || adminProfile.account_status !== "active") {
      return jsonResponse({ error: "Action réservée aux administrateurs actifs." }, 403);
    }

    const body = await request.json() as RequestBody;
    if (!body.action || !["activate_user", "generate_temporary_password"].includes(body.action)) {
      return jsonResponse({ error: "Action invalide." }, 400);
    }
    if (!body.userId || !uuidPattern.test(body.userId)) return jsonResponse({ error: "Utilisateur invalide." }, 400);

    const { data: targetProfile, error: targetError } = await adminClient
      .from("profiles")
      .select("id, role, account_status")
      .eq("id", body.userId)
      .maybeSingle();
    if (targetError) return jsonResponse({ error: "Impossible de charger le compte ciblé." }, 500);
    if (!targetProfile || targetProfile.role !== "teacher") return jsonResponse({ error: "Compte enseignant introuvable." }, 404);

    if (body.action === "activate_user") {
      if (!["pending", "rejected"].includes(targetProfile.account_status)) {
        return jsonResponse({ error: "Ce compte ne peut pas être activé depuis son statut actuel." }, 409);
      }
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(body.userId, { email_confirm: true });
      if (authUpdateError) return jsonResponse({ error: "Impossible de confirmer le compte Auth." }, 500);

      const { error: statusError } = await userClient.rpc("update_teacher_account_status", {
        p_profile_id: body.userId,
        p_account_status: "active",
      });
      if (statusError) return jsonResponse({ error: "Le compte Auth est confirmé, mais le profil n’a pas pu être activé." }, 500);
      return jsonResponse({ success: true });
    }

    const temporaryPassword = generateTemporaryPassword();
    const { error: passwordError } = await adminClient.auth.admin.updateUserById(body.userId, {
      password: temporaryPassword,
      email_confirm: true,
    });
    if (passwordError) return jsonResponse({ error: "Impossible de générer le mot de passe temporaire." }, 500);

    const { error: profileUpdateError } = await adminClient
      .from("profiles")
      .update({ must_change_password: true, updated_at: new Date().toISOString() })
      .eq("id", body.userId)
      .eq("role", "teacher");
    if (profileUpdateError) {
      return jsonResponse({
        success: true,
        temporaryPassword,
        warning: "Le mot de passe a été généré, mais le changement obligatoire n’a pas pu être enregistré.",
      }, 207);
    }

    const { error: auditError } = await adminClient.from("audit_logs").insert({
      actor_user_id: authData.user.id,
      action: "teacher_temporary_password_generated",
      entity_type: "profile",
      entity_id: body.userId,
      new_data: { must_change_password: true, email_confirmed: true },
    });
    if (auditError) {
      console.error("admin-manage-user audit insert failed");
      return jsonResponse({
        success: true,
        temporaryPassword,
        warning: "Le mot de passe a été généré, mais la trace d’audit n’a pas pu être enregistrée.",
      });
    }

    return jsonResponse({ success: true, temporaryPassword });
  } catch (error) {
    console.error("admin-manage-user failed", error instanceof Error ? error.message : "unknown error");
    return jsonResponse({ error: "Une erreur serveur est survenue." }, 500);
  }
});
