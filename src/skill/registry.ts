import type { SkillMeta } from "./types.js";

export class SkillRegistry {
  private skills = new Map<string, SkillMeta>();

  register(skill: SkillMeta): void {
    this.skills.set(skill.name, skill);
  }

  unregister(name: string): void {
    this.skills.delete(name);
  }

  get(name: string): SkillMeta | undefined {
    return this.skills.get(name);
  }

  getAll(): SkillMeta[] {
    return Array.from(this.skills.values());
  }

  getActive(): SkillMeta[] {
    return this.getAll().filter(s => s.state === "active");
  }

  search(query: string): SkillMeta[] {
    const q = query.toLowerCase();
    return this.getAll().filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q)
    );
  }

  getByCategory(category: string): SkillMeta[] {
    return this.getAll().filter(s => s.category === category);
  }
}
