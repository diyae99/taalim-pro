import fs from "node:fs";

for (const file of [".env.test", ".env"]) {
  if (fs.existsSync(file)) process.loadEnvFile(file);
}

export const config = {
  environment: process.env.TEST_ENVIRONMENT ?? "local",
  baseUrl: process.env.TEST_BASE_URL ?? "http://127.0.0.1:4173",
  supabaseUrl: process.env.VITE_SUPABASE_URL ?? "",
  publishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
  emailDomain: process.env.TEST_EMAIL_DOMAIN ?? "gmail.com",
  adminEmail: process.env.TEST_ADMIN_EMAIL ?? "",
  adminPassword: process.env.TEST_ADMIN_PASSWORD ?? "",
  batchDelayMs: Number(process.env.TEST_BATCH_DELAY_MS ?? 3000),
  runStatusMutation: process.env.RUN_STATUS_MUTATION === "true",
  allowProduction: process.env.ALLOW_PRODUCTION_LOAD_TEST === "true",
};

export const assertSafeEnvironment = () => {
  const failures = [];
  const urls = `${config.baseUrl} ${config.supabaseUrl}`.toLowerCase();
  if (urls.includes("taalim-pro.vercel.app") && !config.allowProduction) failures.push("Le domaine de production Taalim Pro est interdit.");
  if (!['local', 'staging'].includes(config.environment)) failures.push("TEST_ENVIRONMENT doit être local ou staging.");
  if (!config.baseUrl.startsWith("http://127.0.0.1") && !config.baseUrl.startsWith("http://localhost") && config.environment !== "staging") failures.push("L’URL applicative n’est pas locale.");
  if (config.environment !== "staging") failures.push("TEST_ENVIRONMENT doit être staging.");
  if (config.baseUrl !== "http://127.0.0.1:4173") failures.push("TEST_BASE_URL doit être http://127.0.0.1:4173.");
  if (config.supabaseUrl !== "https://rbvepwexsndwdnzdhfcp.supabase.co") failures.push("Le projet Supabase ne correspond pas au staging autorisé.");
  if (config.publishableKey !== "sb_publishable_xyDm2yxHzZhePFwvHkS0tw_3g27HKKD") failures.push("La clé publique staging ne correspond pas à la valeur autorisée.");
  if (failures.length) throw new Error(`Préflight de sécurité refusé : ${failures.join(" ")}`);
};

export const maskEmail = (email) => {
  const [name, domain = ""] = email.split("@");
  return `${name.slice(0, 10)}***@${domain}`;
};
