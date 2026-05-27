import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { SkillMeta, SkillSource } from "./types.js";
import { SkillRegistry } from "./registry.js";

const SKILLS_DIR = path.join(os.homedir(), ".alloy", "skills");

export class SkillCreator {
  private registry: SkillRegistry;

  constructor(registry: SkillRegistry) {
    this.registry = registry;
  }

  createFromExperience(
    name: string,
    description: string,
    prompt: string,
    category = "agent-created"
  ): SkillMeta | null {
    const skillDir = path.join(SKILLS_DIR, name);
    if (fs.existsSync(skillDir)) return null;

    try {
      fs.mkdirSync(skillDir, { recursive: true });

      const skillMd = [
        `name: ${name}`,
        `description: ${description}`,
        `source: agent`,
        `category: ${category}`,
        ``,
        prompt,
      ].join("\n");

      fs.writeFileSync(path.join(skillDir, "SKILL.md"), skillMd, "utf-8");

      const meta: SkillMeta = {
        name,
        description,
        source: "agent",
        category,
        path: skillDir,
        createdAt: Date.now(),
        state: "active",
        usageCount: 0,
      };

      this.registry.register(meta);
      return meta;
    } catch {
      return null;
    }
  }

  createManual(
    name: string,
    description: string,
    prompt: string,
    category = "general"
  ): SkillMeta | null {
    return this.createFromExperience(name, description, prompt, category);
  }

  watchCorrection(
    userMessage: string,
    assistantResponse: string,
  ): SkillMeta | null {
    const lower = userMessage.toLowerCase();

    const correctionPatterns = [
      { match: /\b(?:no|wrong|incorrect|not\s+what\s+I\s+meant)\b/i, weight: 3 },
      { match: /\b(?:instead|rather|prefer)\b.*\b(?:use|do|make|implement|write)\b/i, weight: 3 },
      { match: /\b(?:actually|rethink|redesign|rework)\b/i, weight: 2 },
      { match: /\b(?:should\s+have|ought\s+to|better\s+to)\b/i, weight: 2 },
      { match: /\b(?:don'?t\s+use|stop\s+using|avoid)\b/i, weight: 2 },
      { match: /\b(?:try\s+this|like\s+this|way\s+to\s+do)\b/i, weight: 1 },
      { match: /\b(?:correction|fix|oops|mistake|error)\b/i, weight: 1 },
    ];

    let weight = 0;
    for (const p of correctionPatterns) {
      if (p.match.test(lower)) weight += p.weight;
    }

    if (weight < 2) return null;

    const topicMatch = userMessage.match(
      /\b(?:using|with|for|in|about|on)\s+([a-zA-Z][a-zA-Z0-9_.-]{2,})/i
    );
    const topic = topicMatch ? topicMatch[1] : "correction";
    const name = `auto-${topic}-${Date.now().toString(36)}`;

    const instruction = userMessage.length > 200
      ? userMessage.slice(0, 200) + "..."
      : userMessage;

    const prompt = [
      `## Correction Pattern: ${topic}`,
      ``,
      `When the user requests something related to "${topic}", apply this correction:`,
      ``,
      instruction,
      ``,
      `This was learned from a user correction. Always apply this preference.`,
    ].join("\n");

    return this.createFromExperience(
      name,
      `Learned from user correction about ${topic}`,
      prompt,
      "auto-extracted",
    );
  }
}
