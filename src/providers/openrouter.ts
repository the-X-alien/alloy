import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

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
      yield { type: "error" as const, message: "OPENROUTER_API_KEY not configured." };
      return;
    }

    const url = `${this.baseUrl}/chat/completions`;

    const body: Record<string, any> = {
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
      yield { type: "error" as const, message: `Error ${resp.status}: ${err}` };
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) { yield { type: "error" as const, message: "No body" }; return; }

    const decoder = new TextDecoder();
    let buffer = "";
    const indexToId = new Map<number, string>();
    const toolCallName = new Map<string, string>();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            for (const [id, name] of toolCallName) {
              yield { type: "tool_call_end" as const, id, name };
            }
            return;
          }
          try {
            const json = JSON.parse(data);
            const choice = json.choices?.[0];
            if (!choice) continue;

            const content = choice.delta?.content;
            if (content) yield { type: "text" as const, content };

            if (choice.delta?.reasoning) {
              yield { type: "reasoning" as const, content: choice.delta.reasoning };
            }

            const finishReason = choice.finish_reason;
            if (finishReason === "tool_calls") {
              for (const [id, name] of toolCallName) {
                yield { type: "tool_call_end" as const, id, name };
              }
              continue;
            }

            const toolCalls = choice.delta?.tool_calls;
            if (toolCalls) {
              for (const tc of toolCalls) {
                const idx = tc.index ?? 0;
                if (tc.id) {
                  indexToId.set(idx, tc.id);
                  toolCallName.set(tc.id, tc.function?.name ?? "");
                  yield { type: "tool_call_start" as const, id: tc.id, name: tc.function?.name ?? "" };
                }
                const resolvedId = tc.id ?? indexToId.get(idx);
                if (tc.function?.arguments && resolvedId) {
                  yield { type: "tool_call_delta" as const, id: resolvedId, delta: tc.function.arguments };
                }
              }
            }
          } catch { }
        }
      }
    }
    for (const [id, name] of toolCallName) {
      yield { type: "tool_call_end" as const, id, name };
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    return 0;
  }
}
