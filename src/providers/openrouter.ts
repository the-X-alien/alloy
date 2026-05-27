import type { Provider, ChatMessage, ChatOptions, ProviderConfig } from "./interface.js";

interface OpenRouterResponse {
  id: string;
  choices: {
    index: number;
    delta: { content?: string; reasoning?: string };
    finish_reason: string | null;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterProvider implements Provider {
  id = "openrouter";
  name = "OpenRouter";
  configured: boolean;
  private apiKey: string | null = null;
  private baseUrl = "https://openrouter.ai/api/v1";

  constructor(config: ProviderConfig) {
    this.apiKey = process.env[config.apiKeyEnv] ?? null;
    this.configured = !!this.apiKey || !config.apiKeyEnv;
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.apiKey) {
      yield "Error: OPENROUTER_API_KEY not configured.";
      return;
    }

    const url = `${this.baseUrl}/chat/completions`;

    const body: Record<string, any> = {
      model: opts.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
      max_tokens: opts.model.includes("grok") ? undefined : 8192,
      include_reasoning: true,
    };

    if (opts.tools && opts.tools.length > 0) {
      body.tools = opts.tools;
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
        "HTTP-Referer": "https://github.com/the-X-alien/alloy",
        "X-Title": "Alloy",
      },
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
            const json: OpenRouterResponse = JSON.parse(data);
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { }
        }
      }
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    return 0;
  }
}
