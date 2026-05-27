import { SkillLoader } from "./loader.js";
import { SkillRegistry } from "./registry.js";
import { SkillCreator } from "./creator.js";
import { SkillCurator } from "./curator.js";
import type { SkillMeta } from "./types.js";
import * as path from "node:path";
import * as os from "node:os";

const SKILLS_DIR = path.join(os.homedir(), ".alloy", "skills");

export class SkillManager {
  private loader = new SkillLoader();
  private registry = new SkillRegistry();
  private creator: SkillCreator;
  private curator: SkillCurator;

  constructor() {
    this.creator = new SkillCreator(this.registry);
    this.curator = new SkillCurator(this.registry);
    this.discover();
  }

  discover(): void {
    const skills = this.loader.loadFromDir(SKILLS_DIR);
    for (const s of skills) this.registry.register(s);
  }

  getAll(): SkillMeta[] {
    return this.registry.getAll();
  }

  getActive(): SkillMeta[] {
    return this.registry.getActive();
  }

  get(name: string): SkillMeta | undefined {
    return this.registry.get(name);
  }

  search(query: string): SkillMeta[] {
    return this.registry.search(query);
  }

  create(name: string, description: string, prompt: string, category?: string): SkillMeta | null {
    return this.creator.createManual(name, description, prompt, category);
  }

  curate(): { archived: string[]; skipped: string[] } {
    return this.curator.curate();
  }

  injectSystemPrompt(): string {
    const active = this.getActive();
    if (active.length === 0) return "";

    const lines = active.map(s =>
      `- ${s.name}: ${s.description}`
    );

    return [
      ``,
      `## Available Skills`,
      `The following skills are available to use when relevant:`,
      ...lines,
      ``,
    ].join("\n");
  }
}
