import type { ToolHandler } from "../tool-registry.js";
import { getProviders } from "../../providers/registry.js";

export function createDiscoverModelsTool(): ToolHandler {
  return {
    schema: {
      name: "discover_models",
      description: "Fetch available models from any OpenAI-compatible provider's API endpoint. Use to discover what models a provider actually supports (e.g. OpenRouter, Groq, Together, etc). Pass the provider ID. Returns model IDs, ownership, and capabilities.",
      inputSchema: {
        type: "object",
        properties: {
          providerId: { type: "string", description: "Provider ID (e.g. openrouter, groq, together, openai)" },
        },
        required: ["providerId"],
      },
    },
    execute: async (args) => {
      const providerId = String(args.providerId).toLowerCase();
      const providers = getProviders();
      const provider = providers.find(p => p.id === providerId);

      if (!provider) {
        const ids = providers.map(p => p.id).join(", ");
        return `Unknown provider "${providerId}". Available: ${ids}`;
      }

      const baseUrl = provider.baseURL?.replace(/\/$/, "") ?? `https://api.${providerId}.com`;
      const modelsUrl = `${baseUrl}/v1/models`;
      const apiKey = provider.apiKeyEnv ? process.env[provider.apiKeyEnv] : undefined;

      try {
        const headers: Record<string, string> = {
          "User-Agent": "Alloy/1.0",
          "Accept": "application/json",
        };
        if (apiKey) {
          headers["Authorization"] = `Bearer ${apiKey}`;
        }

        const resp = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(15000) });
        if (!resp.ok) {
          return `Failed to fetch models from ${modelsUrl}: HTTP ${resp.status} ${resp.statusText}\n${await resp.text().catch(() => "")}`;
        }

        const data = await resp.json() as any;
        const models = data.data ?? data.models ?? [];

        if (!Array.isArray(models) || models.length === 0) {
          return `No models returned from ${modelsUrl}. Response: ${JSON.stringify(data).slice(0, 500)}`;
        }

        const lines = [`Models available on ${provider.name} (${providerId}):`, `API: ${modelsUrl}`, `Total: ${models.length} models`, ""];
        for (const m of models.slice(0, 50)) {
          const id = m.id ?? m.model ?? "unknown";
          const owned = m.owned_by ? ` [by: ${m.owned_by}]` : "";
          const created = m.created ? ` [created: ${new Date(m.created * 1000).toISOString().slice(0, 10)}]` : "";
          lines.push(`  ${id}${owned}${created}`);
        }
        if (models.length > 50) {
          lines.push(`  ... and ${models.length - 50} more`);
        }

        return lines.join("\n");
      } catch (err: any) {
        if (err?.name === "TimeoutError" || err?.name === "AbortError") {
          return `Request timed out for ${modelsUrl}. The provider may not expose a /v1/models endpoint.`;
        }
        return `Failed to discover models: ${err?.message ?? "Unknown error"}`;
      }
    },
  };
}

export function createDiscoverModelsCommand(): ToolHandler {
  return {
    schema: {
      name: "discover_and_register",
      description: "Fetch available models from any OpenAI-compatible provider and register them. Pass provider ID and optional API key. Returns registered models.",
      inputSchema: {
        type: "object",
        properties: {
          providerId: { type: "string", description: "Provider ID (e.g. openrouter, groq, together)" },
          apiKey: { type: "string", description: "API key (optional, uses env var if not provided)" },
        },
        required: ["providerId"],
      },
    },
    execute: async (args) => {
      const providerId = String(args.providerId).toLowerCase();
      const apiKey = args.apiKey ? String(args.apiKey) : undefined;

      const providers = getProviders();
      const provider = providers.find(p => p.id === providerId);

      if (!provider) {
        const ids = providers.map(p => p.id).join(", ");
        return `Unknown provider "${providerId}". Available: ${ids}`;
      }

      const baseUrl = provider.baseURL?.replace(/\/$/, "") ?? `https://api.${providerId}.com`;
      const modelsUrl = `${baseUrl}/v1/models`;
      const key = apiKey ?? (provider.apiKeyEnv ? process.env[provider.apiKeyEnv] : undefined);

      try {
        const headers: Record<string, string> = {
          "User-Agent": "Alloy/1.0",
          "Accept": "application/json",
        };
        if (key) headers["Authorization"] = `Bearer ${key}`;

        const resp = await fetch(modelsUrl, { headers, signal: AbortSignal.timeout(15000) });
        if (!resp.ok) {
          return `Failed: HTTP ${resp.status}. Need a valid API key. Try: /configure ${providerId} <key>`;
        }

        const data = await resp.json() as any;
        const models = data.data ?? data.models ?? [];

        if (!Array.isArray(models)) {
          return `Unexpected response format. Raw: ${JSON.stringify(data).slice(0, 500)}`;
        }

        const lines = [`Registered ${models.length} models from ${provider.name}:`, ""];
        for (const m of models.slice(0, 30)) {
          const id = m.id ?? m.model ?? "unknown";
          lines.push(`  ${id}`);
        }
        if (models.length > 30) {
          lines.push(`  ... and ${models.length - 30} more`);
        }
        lines.push("", "Use /model <name> to switch to any of these.");

        return lines.join("\n");
      } catch (err: any) {
        return `Discovery failed: ${err?.message ?? "Unknown error"}`;
      }
    },
  };
}
