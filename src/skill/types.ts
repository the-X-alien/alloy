export type SkillSource = "bundled" | "agent" | "user";
export type SkillState = "active" | "archived" | "disabled";

export interface SkillMeta {
  name: string;
  description: string;
  source: SkillSource;
  category: string;
  path: string;
  createdAt: number;
  lastUsedAt?: number;
  state: SkillState;
  usageCount: number;
}
