import type { AgentConfig, AgentResult, PlanArtifact, PlanStep } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";
import type { LoopConfig } from "./conversation-loop.js";
import { PlanAgent } from "./plan.js";
import { BuildAgent } from "./build.js";

export interface OrchestrationResult {
  plan: PlanArtifact;
  stepResults: AgentResult[];
  mergedOutput: string;
}

export class Orchestrator {
  private planAgent = new PlanAgent();
  private buildAgent = new BuildAgent();

  async plan(
    userMessage: string,
    messages: ChatMessage[],
    config: AgentConfig,
    loopConfig: LoopConfig,
  ): Promise<OrchestrationResult> {
    const planResult = await this.planAgent.execute(userMessage, messages, config, loopConfig, () => { });

    if (!planResult.plan) {
      throw new Error("Plan agent did not produce a valid plan artifact");
    }

    return {
      plan: planResult.plan,
      stepResults: [],
      mergedOutput: planResult.output,
    };
  }

  async build(
    plan: PlanArtifact,
    config: AgentConfig,
    loopConfig: LoopConfig,
  ): Promise<OrchestrationResult> {
    const stepResults: AgentResult[] = [];
    const planContext = JSON.stringify(plan, null, 2);
    const completed = new Set<string>();
    const outputs: string[] = [];
    const maxParallel = 3;

    const remaining = [...plan.steps];

    while (remaining.length > 0) {
      const ready = remaining.filter(s =>
        s.dependencies.every(d => completed.has(d))
      );

      if (ready.length === 0) {
        throw new Error(`Circular dependency detected in plan steps`);
      }

      const batch = ready.slice(0, maxParallel);
      for (const step of batch) {
        const idx = remaining.indexOf(step);
        if (idx >= 0) remaining.splice(idx, 1);
      }

      const batchResults = await Promise.all(
        batch.map(async (step) => {
          step.status = "running";
          const result = await this.buildAgent.executeStep(
            step,
            planContext,
            config,
            loopConfig,
            () => { },
          );
          step.status = "done";
          step.result = result.output;
          completed.add(step.id);
          return result;
        })
      );

      for (const result of batchResults) {
        stepResults.push(result);
        outputs.push(`## Step ${result.output.slice(0, 60)}...\n\n${result.output}`);
      }
    }

    return {
      plan,
      stepResults,
      mergedOutput: outputs.join("\n\n---\n\n"),
    };
  }
}
