import OpenAI from "openai";
import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

export class OpenAIProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private client: OpenAI | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    const key = process.env[config.apiKeyEnv];
    this.configured = !!key;
    if (key) {
      this.client = new OpenAI({
        apiKey: key,
        baseURL: config.baseUrl,
      });
    }
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.client) {
      yield { type: "error" as const, message: "OpenAI API key not configured. Set OPENAI_API_KEY." };
      return;
    }

    const stream = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map(m => ({
        role: m.role as "user" | "assistant" | "system" | "tool",
        content: m.content,
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        ...(m.toolCalls ? { tool_calls: m.toolCalls.map(tc => ({
          id: tc.id ?? "",
          type: "function" as const,
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })) } : {}),
      })),
      stream: true,
      ...(opts.tools ? { tools: opts.tools } : {}),
    });

    for await (const chunk of stream) {
      const choice = chunk.choices?.[0];
      if (!choice) continue;

      const content = choice.delta?.content;
      if (content) yield { type: "text" as const, content };

      const toolCalls = choice.delta?.tool_calls;
      if (toolCalls) {
        for (const tc of toolCalls) {
          if (tc.id) {
            yield { type: "tool_call_start" as const, id: tc.id, name: tc.function?.name ?? "" };
          }
          if (tc.function?.arguments) {
            yield { type: "tool_call_delta" as const, id: tc.id ?? tc.index?.toString() ?? "", delta: tc.function.arguments };
          }
        }
      }
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const m = this.config.models.find(m => m.id === model || m.name === model);
    if (!m) return 0;
    return (inputTokens / 1_000_000 * m.costPerInputToken) +
           (outputTokens / 1_000_000 * m.costPerOutputToken);
  }
}
