import { AgentMode } from "../types.js";
import { ChatAgent } from "./chat.js";
import { PlanAgent } from "./plan.js";
import { BuildAgent } from "./build.js";
import type { Orchestrator } from "./orchestrator.js";

export type AgentFactory = () => ChatAgent | PlanAgent | BuildAgent;

export class AgentRegistry {
  private factories = new Map<AgentMode, AgentFactory>();

  constructor(orchestrator?: Orchestrator) {
    this.register(AgentMode.Chat, () => new ChatAgent());
    this.register(AgentMode.Plan, () => new PlanAgent());
    this.register(AgentMode.Build, () => new BuildAgent());
  }

  register(mode: AgentMode, factory: AgentFactory): void {
    this.factories.set(mode, factory);
  }

  create(mode: AgentMode): ChatAgent | PlanAgent | BuildAgent {
    const factory = this.factories.get(mode);
    if (!factory) throw new Error(`Unknown agent mode: ${mode}`);
    return factory();
  }
}
