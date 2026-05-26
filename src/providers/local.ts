import type { Provider, ChatMessage, ChatOptions, ProviderConfig } from "./interface.js";

export class LocalProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private config: ProviderConfig;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.baseUrl = config.baseUrl ?? "http://localhost:11434";
    this.configured = true;
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    const url = `${this.baseUrl}/v1/chat/completions`;

    const body = {
      model: opts.model,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream: true,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const key = this.config.apiKeyEnv ? process.env[this.config.apiKeyEnv] : null;
    if (key) headers["Authorization"] = `Bearer ${key}`;

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        yield `${this.name} not reachable at ${this.baseUrl}\nMake sure it's running. Try: ollama serve\n`;
        yield `Error: ${resp.status} ${resp.statusText}`;
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
    } catch (err: any) {
      yield `${this.name} not reachable at ${this.baseUrl}\n`;
      yield `Make sure it's running. Install from ollama.com or lmstudio.ai\n`;
      yield `Error: ${err?.message ?? "Connection refused"}`;
    }
  }

  estimateCost(_model: string, _inputTokens: number, _outputTokens: number): number {
    return 0;
  }
}
