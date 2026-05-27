import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

export class GoogleProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private config: ProviderConfig;
  private apiKey: string | null = null;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.apiKey = process.env[config.apiKeyEnv] ?? null;
    this.configured = !!this.apiKey;
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.apiKey) {
      yield { type: "error" as const, message: "Gemini API key not configured. Set GEMINI_API_KEY." };
      return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${opts.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const contents = messages
      .filter(m => m.role !== "system")
      .map(m => ({
        role: m.role === "assistant" ? "model" as const : "user" as const,
        parts: [
          ...(m.content ? [{ text: m.content }] : []),
          ...(m.toolCalls ? m.toolCalls.map(tc => ({
            functionCall: { name: tc.name, args: tc.arguments },
          })) : []),
          ...(m.toolCallId ? [{
            functionResponse: { name: "tool", response: { name: "tool", content: m.content } },
          }] : []),
        ],
      }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: { maxOutputTokens: 8192 },
    };

    const systemMsg = messages.find(m => m.role === "system");
    if (systemMsg) {
      body.systemInstruction = { parts: [{ text: systemMsg.content }] };
    }

    if (opts.tools && opts.tools.length > 0) {
      body.tools = [{
        functionDeclarations: opts.tools.map((t: any) => ({
          name: t.function?.name ?? t.name ?? "unknown",
          description: t.function?.description ?? "",
          parameters: t.function?.parameters ?? t.inputSchema ?? {},
        })),
      }];
    }

    const resp = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      yield { type: "error" as const, message: `Error ${resp.status}: ${err}` };
      return;
    }

    const reader = resp.body?.getReader();
    if (!reader) {
      yield { type: "error" as const, message: "No response body" };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fcIndex = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const json = JSON.parse(line.slice(6));
            const parts = json.candidates?.[0]?.content?.parts;
            if (!parts) continue;

            for (const part of parts) {
              if (part.text) {
                yield { type: "text" as const, content: part.text };
              }
              if (part.functionCall) {
                fcIndex++;
                const fc = part.functionCall;
                const id = `fc_${fcIndex}`;
                yield { type: "tool_call_start" as const, id, name: fc.name ?? "" };
                if (fc.args) {
                  yield { type: "tool_call_delta" as const, id, delta: JSON.stringify(fc.args) };
                }
                yield { type: "tool_call_end" as const, id, name: fc.name ?? "" };
              }
            }
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
