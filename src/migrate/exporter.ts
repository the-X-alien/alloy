import * as path from "node:path";
import * as os from "node:os";
import type { SkillMeta } from "../skill/types.js";
import type { ContextEntry } from "../context-bank/types.js";
import { readJSON, writeJSON } from "../util/fs.js";
import { getProviders, getModels } from "../providers/registry.js";

export interface ExportProfile {
  version: 1;
  exportedAt: string;
  alloyVersion: string;
  providerConfigs: { id: string; name: string; apiKeyEnv: string }[];
  skills: SkillMeta[];
  contextBanks: ContextEntry[];
  stats: {
    totalSkills: number;
    totalContextBanks: number;
    totalProviders: number;
  };
}

export class ProfileExporter {
  export(skills: SkillMeta[], contextBanks: ContextEntry[]): ExportProfile {
    const providers = getProviders().map(p => ({
      id: p.id,
      name: p.name,
      apiKeyEnv: p.apiKeyEnv,
    }));

    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      alloyVersion: "0.1.0",
      providerConfigs: providers,
      skills,
      contextBanks,
      stats: {
        totalSkills: skills.length,
        totalContextBanks: contextBanks.length,
        totalProviders: providers.length,
      },
    };
  }

  exportToFile(skills: SkillMeta[], contextBanks: ContextEntry[], filePath?: string): string {
    const profile = this.export(skills, contextBanks);
    const outputPath = filePath ?? path.join(os.homedir(), ".alloy", "profile-export.json");
    writeJSON(outputPath, profile);
    return outputPath;
  }
}

export class ProfileImporter {
  import(filePath: string): ExportProfile | null {
    return readJSON<ExportProfile>(filePath);
  }
}
