import * as fs from "node:fs";
import * as path from "node:path";
import type { SkillMeta, SkillSource, SkillState } from "./types.js";

export interface RawSkill {
  name: string;
  description: string;
  source: SkillSource;
  category: string;
  commands?: string[];
}

export class SkillLoader {
  loadFromDir(dir: string): SkillMeta[] {
    if (!fs.existsSync(dir)) return [];

    const results: SkillMeta[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillDir = path.join(dir, entry.name);
      const skillMd = path.join(skillDir, "SKILL.md");
      if (!fs.existsSync(skillMd)) continue;

      const raw = this.parseSkillMd(skillMd, entry.name, skillDir);
      if (raw) {
        results.push({
          name: raw.name,
          description: raw.description,
          source: raw.source,
          category: raw.category,
          path: skillDir,
          createdAt: this.getCreationTime(skillMd),
          state: "active",
          usageCount: 0,
        });
      }
    }

    return results;
  }

  loadSingle(skillPath: string): SkillMeta | null {
    const name = path.basename(skillPath);
    const skillMd = path.join(skillPath, "SKILL.md");
    if (!fs.existsSync(skillMd)) return null;

    const raw = this.parseSkillMd(skillMd, name, skillPath);
    if (!raw) return null;

    return {
      name: raw.name,
      description: raw.description,
      source: raw.source,
      category: raw.category,
      path: skillPath,
      createdAt: this.getCreationTime(skillMd),
      state: "active",
      usageCount: 0,
    };
  }

  private parseSkillMd(filePath: string, defaultName: string, dir: string): RawSkill | null {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const name = this.extractField(content, "name") ?? defaultName;
      const description = this.extractField(content, "description") ?? "No description";
      const source = (this.extractField(content, "source") ?? "user") as SkillSource;
      const category = this.extractField(content, "category") ?? "general";
      return { name, description, source, category };
    } catch {
      return null;
    }
  }

  private extractField(content: string, field: string): string | null {
    const re = new RegExp(`${field}:\\s*(.+)`, "i");
    const match = content.match(re);
    return match ? match[1].trim() : null;
  }

  private getCreationTime(filePath: string): number {
    try {
      const stat = fs.statSync(filePath);
      return stat.birthtimeMs || stat.ctimeMs;
    } catch {
      return Date.now();
    }
  }
}
