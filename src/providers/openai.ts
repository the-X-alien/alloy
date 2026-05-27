import OpenAI from "openai";
import type { Provider, ChatMessage, ChatOptions, ProviderConfig } from "./interface.js";

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
      yield "Error: OpenAI API key not configured. Set OPENAI_API_KEY.";
      return;
    }

    const stream = await this.client.chat.completions.create({
      model: opts.model,
      messages: messages.map(m => ({ role: m.role as "user" | "assistant" | "system" | "tool", content: m.content })),
      stream: true,
      ...(opts.tools ? { tools: opts.tools } : {}),
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content;
      if (delta) yield delta;
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const m = this.config.models.find(m => m.id === model || m.name === model);
    if (!m) return 0;
    return (inputTokens / 1_000_000 * m.costPerInputToken) +
           (outputTokens / 1_000_000 * m.costPerOutputToken);
  }
}
