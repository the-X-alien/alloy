import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { DeepPartial } from "../types.js";
import type { AlloyConfig } from "./schema.js";
import { DEFAULT_CONFIG } from "./defaults.js";

const CONFIG_PATH = path.join(os.homedir(), ".alloy", "config.json");

export class ConfigLoader {
  private config: AlloyConfig;

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.loadFromDisk();
    this.applyEnvOverrides();
  }

  getAll(): AlloyConfig {
    return { ...this.config };
  }

  get<K extends keyof AlloyConfig>(key: K): AlloyConfig[K];
  get(key?: string): unknown;
  get(key?: string): unknown {
    if (!key) return { ...this.config };
    return (this.config as any)[key];
  }

  set<K extends keyof AlloyConfig>(key: K, value: AlloyConfig[K]): void {
    (this.config as any)[key] = value;
    this.save();
  }

  update(partial: DeepPartial<AlloyConfig>): void {
    this.deepMerge(this.config, partial);
    this.save();
  }

  private save(): void {
    try {
      const dir = path.dirname(CONFIG_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(this.config, null, 2), "utf-8");
    } catch { }
  }

  private loadFromDisk(): void {
    try {
      if (fs.existsSync(CONFIG_PATH)) {
        const data = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
        this.deepMerge(this.config, data);
      }
    } catch { }
  }

  private applyEnvOverrides(): void {
    const p = this.config.provider;
    if (process.env.ALLOY_DEFAULT_PROVIDER) p.defaultProvider = process.env.ALLOY_DEFAULT_PROVIDER;
    if (process.env.ALLOY_DEFAULT_MODEL) p.defaultModel = process.env.ALLOY_DEFAULT_MODEL;
    if (process.env.ALLOY_BUDGET) this.config.budget.monthlyLimit = parseFloat(process.env.ALLOY_BUDGET);
    if (process.env.ALLOY_THEME) this.config.theme = process.env.ALLOY_THEME;
  }

  private deepMerge(target: any, source: any): void {
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        this.deepMerge(target[key], source[key]);
      } else if (source[key] !== undefined) {
        target[key] = source[key];
      }
    }
  }
}

export let configLoader: ConfigLoader;

export function initConfig(): ConfigLoader {
  configLoader = new ConfigLoader();
  return configLoader;
}
