import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export interface Skill {
  name: string;
  description: string;
  path: string;
  commands?: string[];
}

const SKILLS_DIR = path.join(os.homedir(), ".alloy", "skills");

export class SkillManager {
  private skills: Map<string, Skill> = new Map();

  constructor() {
    this.discover();
  }

  discover() {
    this.skills.clear();
    const dir = SKILLS_DIR;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      return;
    }

    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(dir, entry.name);
          const skillMd = path.join(skillPath, "SKILL.md");
          if (fs.existsSync(skillMd)) {
            const content = fs.readFileSync(skillMd, "utf-8");
            const descMatch = content.match(/description:\s*(.+)/i);
            this.skills.set(entry.name, {
              name: entry.name,
              description: descMatch?.[1] ?? "No description",
              path: skillPath,
            });
          }
        }
      }
    } catch { }
  }

  getAll(): Skill[] {
    return Array.from(this.skills.values());
  }

  get(name: string): Skill | undefined {
    return this.skills.get(name);
  }

  search(query: string): Skill[] {
    const q = query.toLowerCase();
    return this.getAll().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q)
    );
  }
}
