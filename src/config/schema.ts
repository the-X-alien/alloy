import type { AgentMode } from "../types.js";

export interface AlloyConfig {
  version: number;

  provider: {
    defaultProvider: string;
    defaultModel: string;
    fallbackProvider?: string;
    fallbackModel?: string;
  };

  budget: {
    monthlyLimit: number;
    sessionLimit?: number;
    warnThreshold: number;
  };

  review: {
    enabled: boolean;
    model: string;
    memoryThreshold: number;
    minTurns: number;
  };

  mode: {
    defaultMode: AgentMode;
  };

  router: {
    enabled: boolean;
    classifyModel: string;
    cheapModel: string;
    expensiveModel: string;
  };

  context: {
    maxTurns: number;
    compressionThreshold: number;
  };

  theme: string;

  db: {
    path: string;
  };

  skillsDir: string;
  pluginsDir: string;
  memoryDir: string;
  contextBanksDir: string;
}
