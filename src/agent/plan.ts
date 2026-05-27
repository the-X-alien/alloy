import { AgentMode } from "../types.js";
import type { AgentConfig, AgentResult, PlanArtifact, PlanStep } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";
import { runConversation, type LoopConfig } from "./conversation-loop.js";

export class PlanAgent {
  readonly mode = AgentMode.Plan;

  async execute(
    userMessage: string,
    messages: ChatMessage[],
    config: AgentConfig,
    loopConfig: LoopConfig,
    onToken: (token: string) => void,
  ): Promise<AgentResult & { plan?: PlanArtifact }> {
    const planConfig: AgentConfig = {
      ...config,
      mode: AgentMode.Plan,
      systemPrompt: [
        config.systemPrompt ?? "",
        "",
        `You are in PLAN mode. Your task is to produce a structured plan for the user's request.`,
        `Output a JSON plan artifact with this structure:`,
        `{ "title": "...", "goal": "...", "steps": [{ "id": "1", "description": "...", "files": ["..."], "dependencies": [] }] }`,
        `Then explain the plan in natural language.`,
      ].join("\n"),
    };

    const result = await runConversation(userMessage, messages, planConfig, loopConfig, onToken);

    let plan: PlanArtifact | undefined;
    try {
      const planMatch = result.output.match(/\{[\s\S]*?"steps"[\s\S]*?\}/);
      if (planMatch) {
        plan = JSON.parse(planMatch[0]) as PlanArtifact;
      }
    } catch { }

    return { ...result, plan };
  }
}
