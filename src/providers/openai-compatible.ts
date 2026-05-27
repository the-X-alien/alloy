import type { Provider, ChatMessage, ChatOptions, ProviderConfig } from "./interface.js";

export class OpenAICompatibleProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private config: ProviderConfig;
  private apiKey: string | null = null;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.apiKey = process.env[config.apiKeyEnv] ?? null;
    this.baseUrl = config.baseUrl ?? "https://api.openai.com/v1";
    this.configured = !!this.apiKey || !config.apiKeyEnv;
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.apiKey && this.config.apiKeyEnv) {
      yield `Error: ${this.config.apiKeyEnv} not configured.`;
      return;
    }

    const url = `${this.baseUrl}/chat/completions`;

    const body: Record<string, any> = {
      model: opts.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      max_tokens: opts.model.includes("grok") ? undefined : 8192,
    };

    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {}),
    };

    if (this.id === "openrouter") {
      headers["HTTP-Referer"] = "https://alloy.dev";
      headers["X-Title"] = "Alloy";
    }

    const resp = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      yield `Error ${resp.status}: ${err}`;
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) { yield "Error: No body"; return; }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") return;
          try {
            const json = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { }
        }
      }
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const m = this.config.models.find(m => m.id === model);
    if (!m) return 0;
    return (inputTokens / 1_000_000 * m.costPerInputToken) +
           (outputTokens / 1_000_000 * m.costPerOutputToken);
  }
}
