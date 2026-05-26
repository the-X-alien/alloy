import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export type ImportSource = "claude" | "opencode" | "openclaw";

export interface ImportResult {
  source: ImportSource;
  apiKeys: { provider: string; key?: string }[];
  config: Record<string, unknown>;
}

const ERR_API_KEYS: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  gemini: "GEMINI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  groq: "GROQ_API_KEY",
  xai: "XAI_API_KEY",
};

function envName(provider: string): string {
  return ERR_API_KEYS[provider] || `${provider.toUpperCase().replace(/-/g, "_")}_API_KEY`;
}

function importClaude(): ImportResult {
  const result: ImportResult = { source: "claude", apiKeys: [], config: {} };
  const paths = [
    path.join(os.homedir(), ".claude", "config.json"),
    path.join(os.homedir(), ".claude", "claude.json"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, "utf-8"));
        result.config = data;
        if (data.apiKey) result.apiKeys.push({ provider: "anthropic", key: data.apiKey });
        if (data.anthropicApiKey) result.apiKeys.push({ provider: "anthropic", key: data.anthropicApiKey });
      } catch { }
    }
  }
  return result;
}

function importOpenCode(): ImportResult {
  const result: ImportResult = { source: "opencode", apiKeys: [], config: {} };
  const paths = [
    path.join(os.homedir(), ".config", "opencode", "config.json"),
    path.join(os.homedir(), ".config", "opencode", "opencode.json"),
  ];
  for (const p of paths) {
    if (fs.existsSync(p)) {
      try {
        const data = JSON.parse(fs.readFileSync(p, "utf-8"));
        result.config = data;
      } catch { }
    }
  }
  return result;
}

function importOpenClaw(): ImportResult {
  const result: ImportResult = { source: "openclaw", apiKeys: [], config: {} };
  const p = path.join(os.homedir(), ".openclaw", "openclaw.json");
  if (fs.existsSync(p)) {
    try {
      const data = JSON.parse(fs.readFileSync(p, "utf-8"));
      result.config = data;
      if (data.models?.providers) {
        for (const [provider, cfg] of Object.entries(data.models.providers)) {
          if (typeof cfg === "object" && cfg && "apiKey" in cfg) {
            result.apiKeys.push({ provider, key: (cfg as any).apiKey });
          }
        }
      }
    } catch { }
  }
  return result;
}

export function detectTools(): { tool: ImportSource; detected: boolean }[] {
  return [
    { tool: "claude", detected: fs.existsSync(path.join(os.homedir(), ".claude")) },
    { tool: "opencode", detected: fs.existsSync(path.join(os.homedir(), ".config", "opencode")) },
    { tool: "openclaw", detected: fs.existsSync(path.join(os.homedir(), ".openclaw")) },
  ];
}

export function importFrom(source: ImportSource): ImportResult {
  switch (source) {
    case "claude": return importClaude();
    case "opencode": return importOpenCode();
    case "openclaw": return importOpenClaw();
  }
}

export function importAll(): ImportResult[] {
  return [importClaude(), importOpenCode(), importOpenClaw()];
}

export function applyImport(result: ImportResult): string[] {
  const messages: string[] = [];
  for (const ak of result.apiKeys) {
    const env = envName(ak.provider);
    if (ak.key && !process.env[env]) {
      process.env[env] = ak.key;
      messages.push(`Imported ${env} from ${result.source}`);
    }
  }
  if (messages.length === 0) messages.push(`No new keys found from ${result.source}`);
  return messages;
}
