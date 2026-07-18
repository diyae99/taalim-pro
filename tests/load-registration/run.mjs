import { spawnSync } from "node:child_process";
import fs from "node:fs";

fs.mkdirSync("reports/artifacts", { recursive: true });
const test = spawnSync("npx", ["playwright", "test", "tests/load-registration/registration-load.spec.ts"], { stdio: "inherit", env: process.env });
const report = spawnSync("node", ["tests/load-registration/report.mjs"], { stdio: "inherit", env: process.env });
process.exit(test.status || report.status || 0);
