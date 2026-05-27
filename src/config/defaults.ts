import { AgentMode } from "../types.js";
import type { AlloyConfig } from "./schema.js";
import * as path from "node:path";
import * as os from "node:os";

const alloyDir = path.join(os.homedir(), ".alloy");

export const DEFAULT_CONFIG: AlloyConfig = {
  version: 1,

  provider: {
    defaultProvider: "openai",
    defaultModel: "gpt-4o",
  },

  budget: {
    monthlyLimit: 10.0,
    sessionLimit: undefined,
    warnThreshold: 1.0,
  },

  review: {
    enabled: true,
    model: "auto",
    memoryThreshold: 0.6,
    minTurns: 3,
  },

  mode: {
    defaultMode: AgentMode.Chat,
  },

  router: {
    enabled: true,
    classifyModel: "gpt-4o-mini",
    cheapModel: "gpt-4.1-nano",
    expensiveModel: "gpt-4o",
  },

  context: {
    maxTurns: 100,
    compressionThreshold: 80,
  },

  theme: "dark",

  db: {
    path: path.join(alloyDir, "alloy.db"),
  },

  skillsDir: path.join(alloyDir, "skills"),
  pluginsDir: path.join(alloyDir, "plugins"),
  memoryDir: path.join(alloyDir, "memory"),
  contextBanksDir: path.join(alloyDir, "context-banks"),
};
