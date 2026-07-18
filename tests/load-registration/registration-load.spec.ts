import { expect, test, type Browser, type Page } from "@playwright/test";
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import { assertSafeEnvironment, config, maskEmail } from "./environment.mjs";
import { createRunId, generateUsers, publicUser } from "./generate-users.mjs";

type TestUser = ReturnType<typeof generateUsers>[number];
type Result = Record<string, unknown> & { success: boolean; durationMs: number; stage: string };
const resultsPath = "reports/registration-load-results.json";
const manifestPath = "reports/.registration-load-manifest.json";

const writeResults = (payload: Record<string, unknown>) => fs.writeFileSync(resultsPath, JSON.stringify(payload, null, 2));
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const logoBuffer = (type: "image/jpeg" | "image/png") => type === "image/png"
  ? Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZJ9sAAAAASUVORK5CYII=", "base64")
  : Buffer.from("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=", "base64");

async function fillRegistration(page: Page, user: TestUser) {
  await page.goto("/register");
  await page.getByLabel("Nom complet").fill(user.fullName);
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Téléphone").fill(user.phone);
  await page.getByLabel("Nom de l'établissement").fill(user.schoolName);
  await page.getByLabel("Ville").fill(user.city);
  await page.getByLabel("Niveau").selectOption({ label: user.schoolLevel });
  await page.getByLabel("Matière").selectOption({ label: user.schoolSubject });
  await page.getByLabel("Mot de passe", { exact: true }).fill(user.password);
  await page.getByLabel("Confirmation mot de passe").fill(user.password);
  if (user.logoType) await page.getByLabel("Logo de l'établissement").setInputFiles({ name: `logo-${user.index}.${user.logoType === "image/png" ? "png" : "jpg"}`, mimeType: user.logoType, buffer: logoBuffer(user.logoType) });
}

async function registerUser(browser: Browser, user: TestUser, doubleClick = false): Promise<Result> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const started = performance.now();
  let signupStatus: number | null = null;
  let authDurationMs: number | null = null;
  let logoDurationMs: number | null = null;
  let signupCount = 0;
  let signupErrorCode: string | null = null;
  let signupErrorMessage: string | null = null;
  const requestStarts = new Map<string, number>();
  page.on("request", (request) => {
    if (request.url().includes("/auth/v1/signup") || request.url().includes("/storage/v1/object/")) requestStarts.set(request.url(), performance.now());
    if (request.url().includes("/auth/v1/signup")) signupCount += 1;
  });
  page.on("response", (response) => {
    const began = requestStarts.get(response.url());
    if (response.url().includes("/auth/v1/signup")) { signupStatus = response.status(); authDurationMs = began ? performance.now() - began : null; }
    if (response.url().includes("/storage/v1/object/")) logoDurationMs = began ? performance.now() - began : null;
  });
  try {
    await fillRegistration(page, user);
    const button = page.getByRole("button", { name: "Créer mon compte" });
    const signupResponsePromise = page.waitForResponse((response) => response.url().includes("/auth/v1/signup"), { timeout: 15_000 });
    await button.click();
    await expect(page.getByRole("button", { name: /Création du compte/ })).toBeDisabled();
    if (doubleClick) await button.click({ timeout: 300 }).catch(() => undefined);
    const signupResponse = await signupResponsePromise;
    signupStatus = signupResponse.status();
    const signupBody = await signupResponse.json().catch(() => null) as { code?: string; error_code?: string; message?: string } | null;
    signupErrorCode = signupBody?.code ?? signupBody?.error_code ?? null;
    signupErrorMessage = signupBody?.message ?? null;
    if (!signupResponse.ok()) {
      return {
        email: maskEmail(user.email), success: false, durationMs: performance.now() - started,
        stage: "signup", signupStatus, authDurationMs, logoDurationMs, signupCount,
        errorCode: signupErrorCode, error: signupErrorMessage ?? `Inscription refusée (HTTP ${signupStatus})`,
        logoType: user.logoType,
      };
    }
    await expect(page).toHaveURL(/\/account-pending$/, { timeout: 15_000 });
    await expect(page.getByText(/attend|attente|activer/i).first()).toBeVisible();
    return { email: maskEmail(user.email), success: signupCount === 1, durationMs: performance.now() - started, stage: signupCount === 1 ? "complete" : "duplicate_submission", signupStatus, authDurationMs, profileDurationMs: authDurationMs, logoDurationMs, signupCount, logoType: user.logoType };
  } catch (error) {
    return { email: maskEmail(user.email), success: false, durationMs: performance.now() - started, stage: signupStatus ? "ui_after_signup" : "signup", signupStatus, authDurationMs, logoDurationMs, signupCount, errorCode: signupErrorCode, error: signupErrorMessage ?? (error instanceof Error ? error.message.split("\n")[0] : "Erreur inconnue"), logoType: user.logoType };
  } finally { await context.close(); }
}

async function runPool<T, R>(values: T[], concurrency: number, worker: (value: T) => Promise<R>) {
  const output: R[] = [];
  let cursor = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (cursor < values.length) { const index = cursor++; output[index] = await worker(values[index]); }
  }));
  return output;
}

async function verifyAdmin(browser: Browser, mutateStatuses: boolean, runId: string) {
  if (!config.adminEmail || !config.adminPassword) return { skipped: true, reason: "Aucun compte Admin de test n’est configuré." };
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    await page.goto("/login");
    await page.getByLabel("Email").fill(config.adminEmail);
    await page.getByLabel("Mot de passe").fill(config.adminPassword);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page).toHaveURL(/\/admin/);
    await page.goto("/admin/users");
    await page.getByRole("button", { name: "En attente" }).click();
    const testRows = () => page.locator("tbody tr").filter({ hasText: `loadtest+${runId}-` });
    const initialPending = await testRows().count();
    const layoutUsable = await page.locator("table").evaluate((table) => table.scrollWidth > 0 && table.getBoundingClientRect().height > 0);
    const filters = {} as Record<string, boolean>;
    for (const label of ["Tous", "En attente", "Actifs", "Suspendus", "Rejetés"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      filters[label] = await page.getByRole("button", { name: label, exact: true }).isVisible();
    }
    if (!mutateStatuses) return { skipped: false, initialPending, layoutUsable, filters, mutationsSkipped: true };

    await page.getByRole("button", { name: "En attente", exact: true }).click();
    for (let count = 0; count < 15; count += 1) {
      await testRows().first().getByRole("button", { name: "Activer", exact: true }).click();
      await expect(testRows()).toHaveCount(initialPending - count - 1);
    }
    await page.getByRole("button", { name: "Actifs", exact: true }).click();
    for (let count = 0; count < 5; count += 1) {
      await testRows().first().getByRole("button", { name: "Suspendre", exact: true }).click();
    }
    await page.getByRole("button", { name: "En attente", exact: true }).click();
    for (let count = 0; count < 5; count += 1) {
      await testRows().first().getByRole("button", { name: "Rejeter", exact: true }).click();
    }
    const counts: Record<string, number> = {};
    for (const label of ["En attente", "Actifs", "Suspendus", "Rejetés"]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      counts[label] = await testRows().count();
    }
    return { skipped: false, initialPending, layoutUsable, filters, mutationsSkipped: false, counts, expected: { "En attente": 80, Actifs: 10, Suspendus: 5, Rejetés: 5 } };
  } finally { await context.close(); }
}

async function negativeCase(browser: Browser, name: string, user: TestUser, mutate: (page: Page) => Promise<void>, expected: "blocked" | "accepted") {
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await fillRegistration(page, user);
    await mutate(page);
    await page.getByRole("button", { name: "Créer mon compte" }).click();
    const redirected = await page.waitForURL(/\/account-pending$/, { timeout: 5000 }).then(() => true).catch(() => false);
    return { name, success: expected === "accepted" ? redirected : !redirected, message: redirected ? "Inscription acceptée" : "Inscription bloquée" };
  } finally { await context.close(); }
}

test("palier de 10 puis charge fonctionnelle de 100 inscriptions", async ({ browser }) => {
  const runId = process.env.TEST_RUN_ID ?? createRunId();
  const users = generateUsers(runId, config.emailDomain);
  const probeUser = generateUsers(runId, config.emailDomain, 101)[100];
  const smokeUsers = users.slice(0, 10);
  const payload: Record<string, unknown> = { runId, startedAt: new Date().toISOString(), environment: config.environment, baseUrl: config.baseUrl, supabaseUrl: config.supabaseUrl, browser: "Chromium", probe: null, smokePhase: { count: 10, concurrency: 1, results: [] }, phases: [{ count: 10, concurrency: 1 }, { count: 30, concurrency: 3 }, { count: 60, concurrency: 5 }], results: [], negativeTests: [], admin: { skipped: true }, preflight: { success: false }, directSupabaseVerification: { skipped: true, reason: "Aucune clé secrète n’est utilisée." } };
  fs.mkdirSync("reports", { recursive: true });
  fs.writeFileSync(manifestPath, JSON.stringify({ runId, domain: config.emailDomain, users: users.map(publicUser) }, null, 2));
  writeResults(payload);
  try { assertSafeEnvironment(); payload.preflight = { success: true }; } catch (error) { payload.preflight = { success: false, error: error instanceof Error ? error.message : "Préflight refusé" }; writeResults(payload); throw error; }

  const probeResult = await registerUser(browser, probeUser, true);
  payload.probe = probeResult;
  writeResults(payload);
  expect(probeResult.success, "L’inscription sonde doit réussir avant le palier de 10").toBe(true);

  const smokeResults = await runPool(smokeUsers, 1, (user) => registerUser(browser, user, user.index === 1));
  payload.smokePhase = { count: 10, concurrency: 1, results: smokeResults, success: smokeResults.every((result) => result.success) };
  payload.results = smokeResults;
  writeResults(payload);
  expect(smokeResults.filter((result) => result.success), "Le palier de 10 doit réussir avant la charge de 100").toHaveLength(10);

  await delay(config.batchDelayMs);
  const allResults: Result[] = [...smokeResults];
  allResults.push(...await runPool(users.slice(10, 40), 3, (user) => registerUser(browser, user)));
  await delay(config.batchDelayMs);
  allResults.push(...await runPool(users.slice(40), 5, (user) => registerUser(browser, user)));
  payload.results = allResults;
  payload.admin = await verifyAdmin(browser, config.runStatusMutation, runId);

  const negativeBase = generateUsers(`${runId}9`, config.emailDomain, 12);
  const negativeTests = [];
  negativeTests.push(await negativeCase(browser, "mot de passe trop court", negativeBase[0], async (page) => { await page.getByLabel("Mot de passe", { exact: true }).fill("Court1!"); await page.getByLabel("Confirmation mot de passe").fill("Court1!"); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "mots de passe différents", negativeBase[1], async (page) => { await page.getByLabel("Confirmation mot de passe").fill("AutreMotDePasse1!"); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "email invalide", negativeBase[2], async (page) => { await page.getByLabel("Email").fill("email-invalide"); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "téléphone invalide", negativeBase[3], async (page) => { await page.getByLabel("Téléphone").fill("abc"); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "champ obligatoire vide", negativeBase[4], async (page) => { await page.getByLabel("Ville").fill(""); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "logo PDF", negativeBase[5], async (page) => { await page.getByLabel("Logo de l'établissement").setInputFiles({ name: "logo.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4") }); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "logo supérieur à 1 Mo", negativeBase[6], async (page) => { await page.getByLabel("Logo de l'établissement").setInputFiles({ name: "large.png", mimeType: "image/png", buffer: Buffer.alloc(1024 * 1024 + 1) }); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "téléphone dupliqué", { ...negativeBase[7], phone: users[0].phone }, async () => undefined, "accepted"));
  negativeTests.push(await negativeCase(browser, "email dupliqué", { ...negativeBase[8], email: users[0].email }, async () => undefined, "blocked"));

  negativeTests.push(await negativeCase(browser, "interruption réseau simulée", negativeBase[9], async (page) => { await page.route("**/auth/v1/signup", (route) => route.abort("internetdisconnected")); }, "blocked"));
  negativeTests.push(await negativeCase(browser, "réponse Supabase lente", negativeBase[10], async (page) => { await page.route("**/auth/v1/signup", async (route) => { await delay(2000); await route.continue(); }); }, "accepted"));
  negativeTests.push(await negativeCase(browser, "erreur Storage simulée", { ...negativeBase[11], logoType: "image/png" }, async (page) => { await page.route("**/storage/v1/object/**", (route) => route.abort("failed")); }, "accepted"));
  payload.negativeTests = negativeTests;
  payload.finishedAt = new Date().toISOString();
  writeResults(payload);
  expect(allResults.filter((result) => result.success)).toHaveLength(100);
});
