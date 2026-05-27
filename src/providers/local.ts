import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

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
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.toolCallId ? { tool_call_id: m.toolCallId } : {}),
        ...(m.toolCalls ? { tool_calls: m.toolCalls.map(tc => ({
          id: tc.id ?? "",
          type: "function",
          function: { name: tc.name, arguments: JSON.stringify(tc.arguments) },
        })) } : {}),
      })),
      stream: true,
      ...(opts.tools && opts.tools.length > 0 ? { tools: opts.tools } : {}),
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
        yield { type: "error" as const, message: `${this.name} not reachable at ${this.baseUrl}\nMake sure it's running. Try: ollama serve\nError: ${resp.status} ${resp.statusText}` };
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { yield { type: "error" as const, message: "No body" }; return; }

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
              const choice = json.choices?.[0];
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
            } catch { }
          }
        }
      }
    } catch (err: any) {
      yield { type: "error" as const, message: `${this.name} not reachable at ${this.baseUrl}\nMake sure it's running.\nError: ${err?.message ?? "Connection refused"}` };
    }
  }

  estimateCost(_model: string, _inputTokens: number, _outputTokens: number): number {
    return 0;
  }
}
