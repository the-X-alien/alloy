import Anthropic from "@anthropic-ai/sdk";
import type { Provider, ChatMessage, ChatOptions, ProviderConfig } from "./interface.js";

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
      yield "Error: Anthropic API key not configured. Set ANTHROPIC_API_KEY.";
      return;
    }

    const systemMsg = messages.find(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system").map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const stream = await this.client.messages.create({
      model: opts.model,
      system: systemMsg?.content,
      messages: nonSystem,
      max_tokens: 8192,
      stream: true,
      ...(opts.tools ? { tools: opts.tools as any[] } : {}),
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
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
