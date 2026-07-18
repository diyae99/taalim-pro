import fs from "node:fs";
import { execFileSync } from "node:child_process";

fs.mkdirSync("reports", { recursive: true });
const path = "reports/registration-load-results.json";
const data = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, "utf8")) : { results: [], preflight: { success: false, error: "Aucun résultat Playwright." } };
const rows = Array.isArray(data.results) ? data.results : [];
const durations = rows.map((row) => Number(row.durationMs)).filter(Number.isFinite).sort((a, b) => a - b);
const percentile = (ratio) => durations.length ? durations[Math.min(durations.length - 1, Math.floor((durations.length - 1) * ratio))] : 0;
const success = rows.filter((row) => row.success).length;
const smokeRows = data.smokePhase?.results ?? [];
const loadRows = rows;
const smokeSuccess = smokeRows.filter((row) => row.success).length;
const loadSuccess = loadRows.filter((row) => row.success).length;
const loadExecuted = rows.length === 100;
const http = (code) => rows.filter((row) => row.signupStatus === code).length;
let commit = "inconnu";
try { commit = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(); } catch { /* rapport sans Git */ }
const integrity = data.integrity ?? {};
const decision = !data.preflight?.success || smokeSuccess < 10 || !loadExecuted || loadSuccess < 100 ? "NON PRÊT POUR LA PRODUCTION" : "PRÊT POUR LA PRODUCTION";
const mean = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;
const markdown = `# Résumé exécutif\n\n- Palier initial : ${smokeSuccess}/10 inscriptions réussies.\n- Charge principale : ${loadSuccess}/100 inscriptions réussies.\n- Résultat global : ${success}/${rows.length} inscriptions réussies.\n- Taux de réussite : ${rows.length ? (success / rows.length * 100).toFixed(2) : "0.00"} %.\n- Préflight : ${data.preflight?.success ? "réussi" : `refusé — ${data.preflight?.error ?? "raison inconnue"}`}\n- Conclusion : **${decision}**.\n\n# Environnement\n\n- URL testée : ${data.baseUrl ?? "non exécutée"}\n- Supabase staging : ${data.supabaseUrl ?? "non exécuté"}\n- Date : ${data.startedAt ?? new Date().toISOString()}\n- Commit : ${commit}\n- Navigateur : ${data.browser ?? "Chromium"}\n- Utilisateurs : 10 de validation, puis 100 de charge\n- Concurrence : 1, puis 1 / 3 / 5\n\n# Performances\n\n- Minimum : ${percentile(0).toFixed(0)} ms\n- Moyenne : ${mean.toFixed(0)} ms\n- Médiane : ${percentile(0.5).toFixed(0)} ms\n- P95 : ${percentile(0.95).toFixed(0)} ms\n- Maximum : ${percentile(1).toFixed(0)} ms\n\n# Intégrité des données\n\n- Vérification directe Auth/profiles : non exécutée, aucune clé secrète utilisée.\n- Vérification Admin : ${data.admin?.skipped ? `non exécutée — ${data.admin.reason ?? "aucun compte Admin de test"}` : "exécutée depuis l’interface"}.\n\n# Tests négatifs\n\n${data.negativeTests?.length ? data.negativeTests.map((item) => `- ${item.name}: ${item.success ? "conforme" : "échec"} — ${item.message ?? ""}`).join("\n") : "Non exécutés."}\n\n# Interface Admin\n\n${data.admin?.skipped ? `Non exécutée : ${data.admin.reason ?? "identifiants staging absents"}` : JSON.stringify(data.admin)}\n\n# Erreurs HTTP\n\n- 400 : ${http(400)}\n- 401/403 : ${http(401) + http(403)}\n- 409 : ${http(409)}\n- 413 : ${http(413)}\n- 429 : ${http(429)}\n- 500 : ${http(500)}\n\n# Problèmes détectés\n\n${data.preflight?.success ? "Consulter les résultats JSON pour les échecs par étape." : `- Gravité : critique\n- Scénario : préflight de sécurité\n- Résultat obtenu : ${data.preflight?.error}\n- Recommandation : utiliser exclusivement la configuration staging autorisée.`}\n\n# Conclusion\n\n**${decision}**\n`;
fs.writeFileSync("reports/registration-load-report.md", markdown);
const headers = ["email", "success", "durationMs", "stage", "signupStatus", "errorCode", "authDurationMs", "profileDurationMs", "logoDurationMs", "signupCount", "error"];
const csv = [headers.join(","), ...rows.map((row) => headers.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
fs.writeFileSync("reports/registration-load-results.csv", csv);
console.log(`Rapports générés. Décision : ${decision}`);
