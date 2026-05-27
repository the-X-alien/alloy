import { AgentMode } from "../types.js";
import type { AgentConfig, AgentResult, PlanStep, PlanArtifact } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";
import { runConversation, type LoopConfig } from "./conversation-loop.js";

export class BuildAgent {
  readonly mode = AgentMode.Build;

  async executeStep(
    step: PlanStep,
    planContext: string,
    config: AgentConfig,
    loopConfig: LoopConfig,
    onToken: (token: string) => void,
  ): Promise<AgentResult> {
    const buildConfig: AgentConfig = {
      ...config,
      mode: AgentMode.Build,
      systemPrompt: [
        config.systemPrompt ?? "",
        "",
        `You are in BUILD mode. You are executing step ${step.id} of a plan.`,
        `Step description: ${step.description}`,
        step.files?.length ? `Files to modify: ${step.files.join(", ")}` : "",
        ``,
        `Plan context:`,
        planContext,
        ``,
        `Implement ONLY this step. Output the changes needed.`,
      ].filter(Boolean).join("\n"),
      skipMemory: true,
      skipReview: true,
    };

    return runConversation(
      `Execute step ${step.id}: ${step.description}`,
      [],
      buildConfig,
      loopConfig,
      onToken,
    );
  }
}
