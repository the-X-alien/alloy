import type { ChatMessage, StreamEvent, Provider } from "../providers/interface.js";
import type { AgentConfig, AgentResult } from "./types.js";
import { ToolExecutor } from "./tool-executor.js";
import type { MemoryManager } from "../memory/manager.js";
import type { SkillManager } from "../skill/manager.js";
import type { ContextInjector } from "../context-bank/injector.js";
import type { PluginRuntime } from "../plugin/runtime.js";
import type { CostGovernor } from "../cost/governor.js";
import type { ModelRouter } from "../provider/router.js";
import { buildSystemPrompt } from "./system-prompt.js";

export interface LoopConfig {
  provider: Provider;
  memoryManager: MemoryManager;
  skillManager: SkillManager;
  contextInjector: ContextInjector;
  pluginRuntime?: PluginRuntime;
  costGovernor: CostGovernor;
  modelRouter?: ModelRouter;
  toolExecutor: ToolExecutor;
}

interface PartialToolCall {
  id: string;
  name: string;
  argsBuffer: string;
}

export async function runConversation(
  userMessage: string,
  messages: ChatMessage[],
  config: AgentConfig,
  loopConfig: LoopConfig,
  onToken: (token: string) => void,
): Promise<AgentResult> {
  const {
    provider,
    memoryManager,
    skillManager,
    contextInjector,
    pluginRuntime,
    costGovernor,
    modelRouter,
    toolExecutor,
  } = loopConfig;

  const model = modelRouter && config.mode === "chat"
    ? modelRouter.route(userMessage, costGovernor.getRemaining())
    : config.model;

  const memoryContext = memoryManager.prefetch(userMessage);
  const contextBanks = contextInjector.inject(userMessage);
  const skillsSection = skillManager.injectSystemPrompt();

  const systemPrompt = buildSystemPrompt(
    { memoryContext, contextBanks, skillsSection },
    memoryManager,
    skillManager,
    config.systemPrompt,
  );

  const allMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt, timestamp: Date.now() },
    ...messages,
    { role: "user", content: userMessage, timestamp: Date.now() },
  ];

  if (pluginRuntime) {
    const lastMsg = allMessages[allMessages.length - 1];
    const filtered = await pluginRuntime.hookManager.fire("chat.message", lastMsg);
    allMessages[allMessages.length - 1] = filtered;
  }

  let fullOutput = "";
  let turnCount = 0;
  const maxTurns = config.maxTurns ?? 25;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCost = 0;

  let partialToolCalls = new Map<string, PartialToolCall>();

  while (turnCount < maxTurns) {
    turnCount++;

    let params: Record<string, unknown> = { model };
    if (pluginRuntime) {
      params = await pluginRuntime.hookManager.fire("chat.params", params);
    }

    const toolSchemas = toolExecutor.getToolSchemas();
    const useTools = config.tools !== false && toolSchemas.length > 0;
    const openAITools = toolSchemas.map(s => ({
      type: "function",
      function: { name: s.name, description: s.description, parameters: s.inputSchema },
    }));

    let response = "";
    let turnToolCalls: { id: string; name: string; arguments: Record<string, unknown> }[] = [];

    partialToolCalls.clear();

    for await (const event of provider.chat(allMessages, {
      model: model as string,
      tools: useTools ? openAITools : undefined,
    })) {
      switch (event.type) {
        case "text":
          if (event.content) {
            response += event.content;
            onToken(event.content);
          }
          break;

        case "reasoning":
          if (event.content) onToken(event.content);
          break;

        case "tool_call_start":
          partialToolCalls.set(event.id, { id: event.id, name: event.name, argsBuffer: "" });
          break;

        case "tool_call_delta":
          {
            const existing = partialToolCalls.get(event.id);
            if (existing) {
              existing.argsBuffer += event.delta;
            }
          }
          break;

        case "tool_call_end":
          {
            const tc = partialToolCalls.get(event.id);
            if (tc) {
              let parsed: Record<string, unknown> = {};
              try {
                parsed = JSON.parse(tc.argsBuffer);
              } catch {
                parsed = { _raw: tc.argsBuffer };
              }
              turnToolCalls.push({ id: tc.id, name: tc.name, arguments: parsed });
              partialToolCalls.delete(event.id);
            }
          }
          break;

        case "error":
          response += `\n[Error: ${event.message}]`;
          onToken(`\n[Error: ${event.message}]`);
          break;
      }
    }

    fullOutput += response;

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: response,
      toolCalls: turnToolCalls.length > 0 ? turnToolCalls : undefined,
      timestamp: Date.now(),
      model: model as string,
    };
    allMessages.push(assistantMsg);

    if (turnToolCalls.length === 0) break;

    for (const tc of turnToolCalls) {
      let result: string;

      result = await toolExecutor.execute({
        id: tc.id,
        name: tc.name,
        arguments: tc.arguments,
      });

      const toolMsg: ChatMessage = {
        role: "tool",
        content: result,
        toolName: tc.name,
        toolCallId: tc.id,
        timestamp: Date.now(),
      };
      allMessages.push(toolMsg);
    }

    const inputTokens = estimateTokens(JSON.stringify(allMessages));
    const outputTokens = estimateTokens(response);
    totalInputTokens += inputTokens;
    totalOutputTokens += outputTokens;
    const turnCost = provider.estimateCost(model as string, inputTokens, outputTokens);
    totalCost += turnCost;
    costGovernor.record({
      provider: provider.id,
      model: model as string,
      inputTokens,
      outputTokens,
      cost: turnCost,
    });
  }

  memoryManager.syncTurn(userMessage, fullOutput);

  const result: AgentResult = {
    messages: allMessages.slice(1),
    output: fullOutput,
    model: model as string,
    provider: provider.id,
    totalCost,
    totalTokens: totalInputTokens + totalOutputTokens,
    turns: turnCount,
  };

  return result;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
