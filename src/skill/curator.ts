import type { SkillMeta } from "./types.js";
import { SkillRegistry } from "./registry.js";

const ARCHIVE_AFTER_DAYS = 30;
const NEVER_ARCHIVE_SOURCES = new Set(["bundled", "user"]);

export class SkillCurator {
  private registry: SkillRegistry;

  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }

  curate(): { archived: string[]; skipped: string[] } {
    const archived: string[] = [];
    const skipped: string[] = [];
    const now = Date.now();
    const archiveCutoff = now - ARCHIVE_AFTER_DAYS * 24 * 60 * 60 * 1000;

    for (const skill of this.registry.getActive()) {
      if (NEVER_ARCHIVE_SOURCES.has(skill.source)) {
        skipped.push(skill.name);
        continue;
      }

      const lastUsed = skill.lastUsedAt ?? skill.createdAt;
      if (lastUsed < archiveCutoff) {
        this.archive(skill);
        archived.push(skill.name);
      }
    }

    return { archived, skipped };
  }

  private archive(skill: SkillMeta): void {
    const updated = { ...skill, state: "archived" as const };
    this.registry.unregister(skill.name);
    this.registry.register(updated);
  }
}
