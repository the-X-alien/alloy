import type { ChatMessage } from "../providers/interface.js";
import type { Provider } from "../providers/interface.js";
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
    let toolCalls: any[] = [];

    for await (const chunk of provider.chat(allMessages, {
      model: model as string,
      tools: useTools ? openAITools : undefined,
    })) {
      response += chunk;
      onToken(chunk);
    }

    fullOutput += response;

    const parsedResponse = tryParseResponse(response);

    if (parsedResponse?.toolCalls && parsedResponse.toolCalls.length > 0) {
      toolCalls = parsedResponse.toolCalls;
    }

    if (toolCalls.length === 0) break;

    const assistantMsg: ChatMessage = {
      role: "assistant",
      content: response,
      toolCalls,
      timestamp: Date.now(),
      model: model as string,
    };
    allMessages.push(assistantMsg);

    for (const tc of toolCalls) {
      let result: string;

      if (pluginRuntime) {
        const hookResult = await pluginRuntime.hookManager.fire("tool.execute.before", {
          toolName: tc.name,
          args: tc.arguments,
        });
        if ((hookResult as any)?.abort) {
          result = (hookResult as any).result ?? "Aborted by plugin";
          continue;
        }
      }

      result = await toolExecutor.execute(tc);

      if (pluginRuntime) {
        result = await pluginRuntime.hookManager.fire("tool.execute.after", {
          toolName: tc.name,
          args: tc.arguments,
          result,
        }) as string;
      }

      const toolMsg: ChatMessage = {
        role: "tool",
        content: result,
        toolName: tc.name,
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

function tryParseResponse(response: string): { content?: string; toolCalls?: any[] } | null {
  try {
    const parsed = JSON.parse(response);
    if (parsed.tool_calls || parsed.toolCalls) {
      return {
        content: parsed.content,
        toolCalls: parsed.tool_calls ?? parsed.toolCalls,
      };
    }
  } catch { }
  return null;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
