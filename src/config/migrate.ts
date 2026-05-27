import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { DEFAULT_CONFIG } from "./defaults.js";
import type { AlloyConfig } from "./schema.js";

const CONFIG_PATH = path.join(os.homedir(), ".alloy", "config.json");

export function migrateConfig(): void {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return;

    const raw = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    const currentVersion = raw.version ?? 0;

    if (currentVersion < 1) {
      const migrated: AlloyConfig = {
        ...DEFAULT_CONFIG,
        ...raw,
        version: 1,
      };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(migrated, null, 2), "utf-8");
    }
  } catch { }
}
