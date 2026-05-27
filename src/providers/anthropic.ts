import Anthropic from "@anthropic-ai/sdk";
import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

export class AnthropicProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private client: Anthropic | null = null;
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    const key = process.env[config.apiKeyEnv];
    this.configured = !!key;
    if (key) {
      this.client = new Anthropic({ apiKey: key });
    }
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.client) {
      yield { type: "error" as const, message: "Anthropic API key not configured. Set ANTHROPIC_API_KEY." };
      return;
    }

    const systemMsg = messages.find(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role === "tool" ? "user" as const : m.role as "user" | "assistant",
      content: m.toolCallId
        ? [{ type: "tool_result" as const, tool_use_id: m.toolCallId, content: m.content }]
        : m.toolCalls
          ? [{ type: "tool_use" as const, id: m.toolCalls[0]?.id ?? "", name: m.toolCalls[0]?.name ?? "", input: m.toolCalls[0]?.arguments ?? {} }]
          : [{ type: "text" as const, text: m.content }],
    }));

    const stream = await this.client.messages.create({
      model: opts.model,
      system: systemMsg?.content,
      messages: nonSystem,
      max_tokens: 8192,
      stream: true,
      ...(opts.tools ? {
        tools: opts.tools.map((t: any) => ({
          name: t.function?.name ?? t.name ?? "unknown",
          description: t.function?.description ?? "",
          input_schema: t.function?.parameters ?? t.inputSchema ?? {},
        })),
      } : {}),
    });

    let toolId = "";
    let toolName = "";

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield { type: "text" as const, content: event.delta.text };
      }

      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        toolId = event.content_block.id;
        toolName = event.content_block.name;
        yield { type: "tool_call_start" as const, id: toolId, name: toolName };
        if (event.content_block.input && typeof event.content_block.input === "object") {
          yield { type: "tool_call_delta" as const, id: toolId, delta: JSON.stringify(event.content_block.input) };
        }
      }

      if (event.type === "content_block_delta" && event.delta.type === "input_json_delta") {
        yield { type: "tool_call_delta" as const, id: toolId, delta: event.delta.partial_json };
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
