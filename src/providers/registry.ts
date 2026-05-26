export interface ModelConfig {
  id: string;
  provider: string;
  costPerInputToken: number;
  costPerOutputToken: number;
  contextWindow: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKeyEnv: string;
  baseUrl?: string;
  apiKeyHint: string;
  models: ModelConfig[];
}

export interface ModelEntry {
  model: string;
  provider: string;
  name: string;
  costPerInput: number;
  costPerOutput: number;
  contextWindow: number;
}

export interface ProviderCapabilities {
  chat: boolean;
  stream: boolean;
  tools: boolean;
  vision: boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    apiKeyEnv: "OPENAI_API_KEY",
    apiKeyHint: "sk-... from platform.openai.com",
    models: [
      { id: "gpt-4o", provider: "openai", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "gpt-4o-mini", provider: "openai", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "o3-mini", provider: "openai", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "o4-mini", provider: "openai", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "gpt-4.1-nano", provider: "openai", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    apiKeyHint: "sk-ant-... from console.anthropic.com",
    models: [
      { id: "claude-sonnet-4-20250514", provider: "anthropic", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "claude-sonnet-4", provider: "anthropic", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "claude-3-5-haiku", provider: "anthropic", costPerInputToken: 0.80, costPerOutputToken: 4.00, contextWindow: 200000 },
      { id: "claude-opus-4", provider: "anthropic", costPerInputToken: 15.00, costPerOutputToken: 75.00, contextWindow: 200000 },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    apiKeyHint: "from aistudio.google.com",
    models: [
      { id: "gemini-2.5-pro", provider: "google", costPerInputToken: 1.25, costPerOutputToken: 10.00, contextWindow: 1000000 },
      { id: "gemini-2.5-flash", provider: "google", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 1000000 },
      { id: "gemini-2.0-flash", provider: "google", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    apiKeyHint: "from platform.deepseek.com",
    models: [
      { id: "deepseek-chat", provider: "deepseek", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },
      { id: "deepseek-reasoner", provider: "deepseek", costPerInputToken: 0.55, costPerOutputToken: 2.19, contextWindow: 128000 },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    apiKeyEnv: "XAI_API_KEY",
    apiKeyHint: "from console.x.ai",
    models: [
      { id: "grok-3", provider: "xai", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 131072 },
      { id: "grok-3-mini", provider: "xai", costPerInputToken: 0.30, costPerOutputToken: 1.50, contextWindow: 131072 },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKeyEnv: "OPENROUTER_API_KEY",
    apiKeyHint: "from openrouter.ai",
    models: [
      { id: "openrouter/auto", provider: "openrouter", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "anthropic/claude-sonnet-4-20250514", provider: "openrouter", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "anthropic/claude-3.5-haiku", provider: "openrouter", costPerInputToken: 0.80, costPerOutputToken: 4.00, contextWindow: 200000 },
      { id: "openai/gpt-4o", provider: "openrouter", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "openai/gpt-4o-mini", provider: "openrouter", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "google/gemini-2.5-pro-exp-03-25", provider: "openrouter", costPerInputToken: 1.50, costPerOutputToken: 5.00, contextWindow: 1048576 },
      { id: "deepseek/deepseek-r1", provider: "openrouter", costPerInputToken: 1.00, costPerOutputToken: 5.00, contextWindow: 128000 },
      { id: "qwen/qwq-32b", provider: "openrouter", costPerInputToken: 0.30, costPerOutputToken: 1.20, contextWindow: 32000 },
    ],
  },
  {
    id: "groq",
    name: "Groq",
    apiKeyEnv: "GROQ_API_KEY",
    apiKeyHint: "from console.groq.com",
    models: [
      { id: "llama-3.3-70b-versatile", provider: "groq", costPerInputToken: 0.59, costPerOutputToken: 0.79, contextWindow: 128000 },
      { id: "deepseek-r1-distill-llama-70b", provider: "groq", costPerInputToken: 0.75, costPerOutputToken: 0.99, contextWindow: 128000 },
    ],
  },
  {
    id: "together",
    name: "Together AI",
    apiKeyEnv: "TOGETHER_API_KEY",
    apiKeyHint: "from api.together.ai",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", provider: "together", costPerInputToken: 0.88, costPerOutputToken: 0.88, contextWindow: 128000 },
    ],
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    apiKeyEnv: "FIREWORKS_API_KEY",
    apiKeyHint: "from fireworks.ai",
    models: [
      { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", provider: "fireworks", costPerInputToken: 0.90, costPerOutputToken: 0.90, contextWindow: 128000 },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    apiKeyEnv: "MISTRAL_API_KEY",
    apiKeyHint: "from console.mistral.ai",
    models: [
      { id: "mistral-large-2411", provider: "mistral", costPerInputToken: 2.00, costPerOutputToken: 6.00, contextWindow: 128000 },
      { id: "mistral-small-2501", provider: "mistral", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 128000 },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity",
    apiKeyEnv: "PERPLEXITY_API_KEY",
    apiKeyHint: "from perplexity.ai",
    models: [
      { id: "sonar-pro", provider: "perplexity", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 127000 },
      { id: "sonar", provider: "perplexity", costPerInputToken: 1.00, costPerOutputToken: 1.00, contextWindow: 127000 },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras",
    apiKeyEnv: "CEREBRAS_API_KEY",
    apiKeyHint: "from cloud.cerebras.ai",
    models: [
      { id: "cerebras-llama-3.3-70b", provider: "cerebras", costPerInputToken: 0.60, costPerOutputToken: 0.60, contextWindow: 8192 },
    ],
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    apiKeyEnv: "DEEPINFRA_API_KEY",
    apiKeyHint: "from deepinfra.com",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", provider: "deepinfra", costPerInputToken: 0.38, costPerOutputToken: 0.58, contextWindow: 128000 },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    apiKeyEnv: "GITHUB_TOKEN",
    apiKeyHint: "gh token with copilot scope",
    models: [
      { id: "copilot-gpt-4o", provider: "github-copilot", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "copilot-claude-sonnet", provider: "github-copilot", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 200000 },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed — runs locally",
    models: [
      { id: "llama3", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 8192 },
      { id: "codellama", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 16384 },
      { id: "deepseek-coder", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "qwen2.5-coder", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
    ],
  },
  {
    id: "lmstudio",
    name: "LM Studio (Local)",
    apiKeyEnv: "LM_API_TOKEN",
    apiKeyHint: "Optional, from lmstudio.ai",
    baseUrl: "http://localhost:1234",
    models: [
      { id: "local-model", provider: "lmstudio", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
    ],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    apiKeyEnv: "AZURE_OPENAI_API_KEY",
    apiKeyHint: "Also set AZURE_OPENAI_ENDPOINT",
    models: [
      { id: "gpt-4o", provider: "azure", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
    ],
  },
];

export function getProviders(): ProviderConfig[] {
  return PROVIDERS;
}

export function getModels(): ModelEntry[] {
  const result: ModelEntry[] = [];
  for (const p of PROVIDERS) {
    for (const m of p.models) {
      result.push({
        model: m.id,
        provider: p.id,
        name: `${p.name} ${m.id}`,
        costPerInput: m.costPerInputToken,
        costPerOutput: m.costPerOutputToken,
        contextWindow: m.contextWindow,
      });
    }
  }
  return result;
}

export function getConfiguredProviders(): { providerId: string; modelId: string }[] {
  const result: { providerId: string; modelId: string }[] = [];
  for (const p of PROVIDERS) {
    if (!p.apiKeyEnv || process.env[p.apiKeyEnv]) {
      for (const m of p.models) {
        result.push({ providerId: p.id, modelId: m.id });
      }
    }
  }
  return result;
}

export function getProviderConfig(id: string): ProviderConfig | undefined {
  return PROVIDERS.find(p => p.id === id);
}

export const getProviderConfigs = getProviders;

export function getModelCost(providerId: string, modelId: string): { input: number; output: number } | undefined {
  const p = PROVIDERS.find(p => p.id === providerId);
  if (!p) return undefined;
  const m = p.models.find(m => m.id === modelId);
  if (!m) return undefined;
  return { input: m.costPerInputToken, output: m.costPerOutputToken };
}
