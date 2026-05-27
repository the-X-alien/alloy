import { createHash, createHmac } from "node:crypto";
import type { Provider, ChatMessage, ChatOptions, ProviderConfig, StreamEvent } from "./interface.js";

function sha256(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

function hmac(key: Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf-8").digest();
}

function getSignatureKey(key: string, dateStamp: string, region: string, service: string): Buffer {
  const kDate = hmac(Buffer.from(`AWS4${key}`, "utf-8"), dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  return hmac(kService, "aws4_request");
}

export class BedrockProvider implements Provider {
  id: string;
  name: string;
  configured: boolean;
  private accessKey: string | null = null;
  private secretKey: string | null = null;
  private region = "us-east-1";
  private config: ProviderConfig;

  constructor(config: ProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.config = config;
    this.accessKey = process.env.AWS_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY ?? null;
    this.secretKey = process.env.AWS_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_KEY ?? null;
    this.region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? "us-east-1";
    this.configured = !!(this.accessKey && this.secretKey);
  }

  async *chat(messages: ChatMessage[], opts: ChatOptions) {
    if (!this.accessKey || !this.secretKey) {
      yield { type: "error" as const, message: "AWS credentials not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY." };
      return;
    }

    const modelId = opts.model;
    const region = this.region;
    const service = "bedrock-runtime";
    const host = `bedrock-runtime.${region}.amazonaws.com`;
    const endpoint = `https://${host}/model/${encodeURIComponent(modelId)}/converse-stream`;

    const systemMsg = messages.find(m => m.role === "system");
    const nonSystem = messages.filter(m => m.role !== "system");

    const bodyContent: any[] = nonSystem.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: [
        ...(m.content ? [{ text: m.content }] : []),
        ...(m.toolCalls ? m.toolCalls.map(tc => ({
          toolUse: { toolUseId: tc.id ?? "", name: tc.name, input: tc.arguments },
        })) : []),
        ...(m.toolCallId ? [{
          toolResult: { toolUseId: m.toolCallId, content: [{ text: m.content }] },
        }] : []),
      ],
    }));

    const body = JSON.stringify({
      messages: bodyContent,
      ...(systemMsg ? { system: [{ text: systemMsg.content }] } : {}),
      inferenceConfig: { maxTokens: 8192 },
      ...(opts.tools && opts.tools.length > 0 ? {
        toolConfig: { tools: opts.tools.map((t: any) => ({
          toolSpec: { name: t.function?.name ?? t.name ?? "", description: t.function?.description ?? "", inputSchema: { json: t.function?.parameters ?? t.inputSchema ?? {} } },
        })) },
      } : {}),
    });

    const bodyHash = sha256(body);
    const amzDate = new Date().toISOString().replace(/[:-]/g, "").replace(/\.\d{3}/, "");
    const dateStamp = amzDate.slice(0, 8);

    const canonicalUri = `/model/${encodeURIComponent(modelId)}/converse-stream`;
    const canonicalQuery = "";
    const headers: Record<string, string> = {
      host,
      "x-amz-date": amzDate,
      "x-amz-content-sha256": bodyHash,
      "content-type": "application/json",
    };
    const signedHeaders = Object.keys(headers).sort().join(";");
    const canonicalRequest = [
      "POST",
      canonicalUri,
      canonicalQuery,
      ...Object.entries(headers).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}:${v}`),
      "",
      signedHeaders,
      bodyHash,
    ].join("\n");

    const algorithm = "AWS4-HMAC-SHA256";
    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = [
      algorithm,
      amzDate,
      credentialScope,
      sha256(canonicalRequest),
    ].join("\n");

    const signingKey = getSignatureKey(this.secretKey, dateStamp, region, service);
    const signature = hmac(signingKey, stringToSign).toString("hex");

    headers["Authorization"] = `${algorithm} Credential=${this.accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body,
      });

      if (!resp.ok) {
        const err = await resp.text().catch(() => "");
        yield { type: "error" as const, message: `Error ${resp.status}: ${err}` };
        return;
      }

      const reader = resp.body?.getReader();
      if (!reader) { yield { type: "error" as const, message: "No response body" }; return; }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);

            if (parsed.contentBlockDelta?.delta?.text) {
              yield { type: "text" as const, content: parsed.contentBlockDelta.delta.text };
            }

            if (parsed.contentBlockStart?.start?.toolUse) {
              const tu = parsed.contentBlockStart.start.toolUse;
              yield { type: "tool_call_start" as const, id: tu.toolUseId, name: tu.name };
            }

            if (parsed.contentBlockDelta?.delta?.toolUse?.input) {
              const input = parsed.contentBlockDelta.delta.toolUse.input;
              yield { type: "tool_call_delta" as const, id: "bedrock_1", delta: JSON.stringify(input) };
            }
          } catch {
            const match = trimmed.match(/{[^}]*"text"[^}]*}/);
            if (match) {
              try {
                const parsed = JSON.parse(match[0]);
                if (parsed.text) yield { type: "text" as const, content: parsed.text };
              } catch {}
            }
          }
        }
      }
    } catch (err: any) {
      yield { type: "error" as const, message: `Bedrock error: ${err?.message ?? "Connection failed"}` };
    }
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const m = this.config.models.find(m => m.id === model);
    if (!m) return 0;
    return (inputTokens / 1_000_000 * m.costPerInputToken) +
           (outputTokens / 1_000_000 * m.costPerOutputToken);
  }
}
