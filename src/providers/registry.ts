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
    baseUrl: "https://api.openai.com/v1",
    models: [
      { id: "gpt-4o", provider: "openai", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "gpt-4o-mini", provider: "openai", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "gpt-4.1", provider: "openai", costPerInputToken: 2.00, costPerOutputToken: 8.00, contextWindow: 1000000 },
      { id: "gpt-4.1-nano", provider: "openai", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
      { id: "gpt-4.1-mini", provider: "openai", costPerInputToken: 0.40, costPerOutputToken: 1.60, contextWindow: 1000000 },
      { id: "o1", provider: "openai", costPerInputToken: 15.00, costPerOutputToken: 60.00, contextWindow: 200000 },
      { id: "o1-mini", provider: "openai", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 128000 },
      { id: "o3-mini", provider: "openai", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "o4-mini", provider: "openai", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "gpt-4o-audio-preview", provider: "openai", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
    ],
  },
  {
    id: "anthropic",
    name: "Anthropic",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    apiKeyHint: "sk-ant-... from console.anthropic.com",
    baseUrl: "https://api.anthropic.com/v1",
    models: [
      { id: "claude-sonnet-4-20250514", provider: "anthropic", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "claude-sonnet-4", provider: "anthropic", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "claude-3-5-haiku", provider: "anthropic", costPerInputToken: 0.80, costPerOutputToken: 4.00, contextWindow: 200000 },
      { id: "claude-opus-4", provider: "anthropic", costPerInputToken: 15.00, costPerOutputToken: 75.00, contextWindow: 200000 },
      { id: "claude-opus-4-20250514", provider: "anthropic", costPerInputToken: 15.00, costPerOutputToken: 75.00, contextWindow: 200000 },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    apiKeyHint: "from aistudio.google.com",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    models: [
      { id: "gemini-2.5-pro", provider: "google", costPerInputToken: 1.25, costPerOutputToken: 10.00, contextWindow: 1000000 },
      { id: "gemini-2.5-pro-exp-03-25", provider: "google", costPerInputToken: 1.25, costPerOutputToken: 10.00, contextWindow: 1000000 },
      { id: "gemini-2.5-flash", provider: "google", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 1000000 },
      { id: "gemini-2.0-flash", provider: "google", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
      { id: "gemini-2.0-flash-lite", provider: "google", costPerInputToken: 0.075, costPerOutputToken: 0.30, contextWindow: 1000000 },
      { id: "gemini-1.5-pro", provider: "google", costPerInputToken: 1.25, costPerOutputToken: 5.00, contextWindow: 2000000 },
      { id: "gemini-1.5-flash", provider: "google", costPerInputToken: 0.075, costPerOutputToken: 0.30, contextWindow: 1000000 },
    ],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    apiKeyHint: "from platform.deepseek.com",
    baseUrl: "https://api.deepseek.com",
    models: [
      { id: "deepseek-chat", provider: "deepseek", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },
      { id: "deepseek-reasoner", provider: "deepseek", costPerInputToken: 0.55, costPerOutputToken: 2.19, contextWindow: 128000 },
      { id: "deepseek-v3", provider: "deepseek", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },
    ],
  },
  {
    id: "xai",
    name: "xAI (Grok)",
    apiKeyEnv: "XAI_API_KEY",
    apiKeyHint: "from console.x.ai",
    baseUrl: "https://api.x.ai/v1",
    models: [
      { id: "grok-3", provider: "xai", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 131072 },
      { id: "grok-3-mini", provider: "xai", costPerInputToken: 0.30, costPerOutputToken: 1.50, contextWindow: 131072 },
      { id: "grok-2", provider: "xai", costPerInputToken: 2.00, costPerOutputToken: 10.00, contextWindow: 131072 },
      { id: "grok-2-vision", provider: "xai", costPerInputToken: 2.00, costPerOutputToken: 10.00, contextWindow: 8192 },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    apiKeyEnv: "OPENROUTER_API_KEY",
    apiKeyHint: "from openrouter.ai",
    baseUrl: "https://openrouter.ai/api/v1",
    models: [
      { id: "openrouter/auto", provider: "openrouter", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },

      // Anthropic
      { id: "anthropic/claude-sonnet-4-20250514", provider: "openrouter", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "anthropic/claude-opus-4-20250514", provider: "openrouter", costPerInputToken: 15.00, costPerOutputToken: 75.00, contextWindow: 200000 },
      { id: "anthropic/claude-3.5-haiku", provider: "openrouter", costPerInputToken: 0.80, costPerOutputToken: 4.00, contextWindow: 200000 },
      { id: "anthropic/claude-3-opus", provider: "openrouter", costPerInputToken: 15.00, costPerOutputToken: 75.00, contextWindow: 200000 },
      { id: "anthropic/claude-3.5-sonnet", provider: "openrouter", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },

      // OpenAI
      { id: "openai/gpt-4o", provider: "openrouter", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "openai/gpt-4o-mini", provider: "openrouter", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "openai/gpt-4.1", provider: "openrouter", costPerInputToken: 2.00, costPerOutputToken: 8.00, contextWindow: 1000000 },
      { id: "openai/gpt-4.1-nano", provider: "openrouter", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
      { id: "openai/gpt-4.1-mini", provider: "openrouter", costPerInputToken: 0.40, costPerOutputToken: 1.60, contextWindow: 1000000 },
      { id: "openai/o1", provider: "openrouter", costPerInputToken: 15.00, costPerOutputToken: 60.00, contextWindow: 200000 },
      { id: "openai/o1-mini", provider: "openrouter", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 128000 },
      { id: "openai/o3-mini", provider: "openrouter", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "openai/o3-mini-high", provider: "openrouter", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },
      { id: "openai/o4-mini", provider: "openrouter", costPerInputToken: 1.10, costPerOutputToken: 4.40, contextWindow: 200000 },

      // Google
      { id: "google/gemini-2.5-pro-exp-03-25", provider: "openrouter", costPerInputToken: 1.25, costPerOutputToken: 10.00, contextWindow: 1000000 },
      { id: "google/gemini-2.5-flash", provider: "openrouter", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 1000000 },
      { id: "google/gemini-2.0-flash", provider: "openrouter", costPerInputToken: 0.10, costPerOutputToken: 0.40, contextWindow: 1000000 },
      { id: "google/gemini-2.0-flash-lite", provider: "openrouter", costPerInputToken: 0.075, costPerOutputToken: 0.30, contextWindow: 1000000 },
      { id: "google/gemini-1.5-pro", provider: "openrouter", costPerInputToken: 1.25, costPerOutputToken: 5.00, contextWindow: 2000000 },

      // DeepSeek
      { id: "deepseek/deepseek-chat", provider: "openrouter", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },
      { id: "deepseek/deepseek-reasoner", provider: "openrouter", costPerInputToken: 0.55, costPerOutputToken: 2.19, contextWindow: 128000 },
      { id: "deepseek/deepseek-r1", provider: "openrouter", costPerInputToken: 1.00, costPerOutputToken: 5.00, contextWindow: 128000 },
      { id: "deepseek/deepseek-v3", provider: "openrouter", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },

      // Meta / Llama
      { id: "meta-llama/llama-4-scout", provider: "openrouter", costPerInputToken: 0.18, costPerOutputToken: 0.18, contextWindow: 10000000 },
      { id: "meta-llama/llama-4-maverick", provider: "openrouter", costPerInputToken: 0.20, costPerOutputToken: 0.20, contextWindow: 10000000 },
      { id: "meta-llama/llama-3.3-70b-instruct", provider: "openrouter", costPerInputToken: 0.12, costPerOutputToken: 0.30, contextWindow: 128000 },
      { id: "meta-llama/llama-3.1-8b-instruct", provider: "openrouter", costPerInputToken: 0.05, costPerOutputToken: 0.08, contextWindow: 128000 },
      { id: "meta-llama/llama-3.2-3b-instruct", provider: "openrouter", costPerInputToken: 0.02, costPerOutputToken: 0.04, contextWindow: 128000 },
      { id: "meta-llama/llama-3.2-1b-instruct", provider: "openrouter", costPerInputToken: 0.01, costPerOutputToken: 0.02, contextWindow: 128000 },
      { id: "meta-llama/llama-3.1-405b-instruct", provider: "openrouter", costPerInputToken: 0.79, costPerOutputToken: 0.79, contextWindow: 131072 },

      // Mistral
      { id: "mistralai/mistral-large-2411", provider: "openrouter", costPerInputToken: 2.00, costPerOutputToken: 6.00, contextWindow: 128000 },
      { id: "mistralai/mistral-small-2501", provider: "openrouter", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 32000 },
      { id: "mistralai/mistral-saba-2502", provider: "openrouter", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 32000 },
      { id: "mistralai/mixtral-8x22b-instruct", provider: "openrouter", costPerInputToken: 0.65, costPerOutputToken: 0.65, contextWindow: 65536 },

      // Qwen / Alibaba
      { id: "qwen/qwq-32b", provider: "openrouter", costPerInputToken: 0.30, costPerOutputToken: 1.20, contextWindow: 32000 },
      { id: "qwen/qwen-2.5-72b-instruct", provider: "openrouter", costPerInputToken: 0.35, costPerOutputToken: 0.40, contextWindow: 131072 },
      { id: "qwen/qwen-2.5-32b-instruct", provider: "openrouter", costPerInputToken: 0.18, costPerOutputToken: 0.20, contextWindow: 131072 },
      { id: "qwen/qwen-2.5-coder-32b-instruct", provider: "openrouter", costPerInputToken: 0.18, costPerOutputToken: 0.20, contextWindow: 131072 },
      { id: "qwen/qwen-2.5-vl-72b-instruct", provider: "openrouter", costPerInputToken: 0.35, costPerOutputToken: 0.40, contextWindow: 131072 },
      { id: "qwen/qwen-max", provider: "openrouter", costPerInputToken: 1.60, costPerOutputToken: 6.40, contextWindow: 32768 },
      { id: "qwen/qwen-plus", provider: "openrouter", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 131072 },
      { id: "qwen/qwen-turbo", provider: "openrouter", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 131072 },

      // xAI
      { id: "x-ai/grok-3", provider: "openrouter", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 131072 },
      { id: "x-ai/grok-3-mini", provider: "openrouter", costPerInputToken: 0.30, costPerOutputToken: 1.50, contextWindow: 131072 },

      // Cohere
      { id: "cohere/command-r7b-12-2024", provider: "openrouter", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "cohere/command-r-plus-04-2024", provider: "openrouter", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },

      // Nous Research
      { id: "nousresearch/hermes-3-llama-3.1-405b", provider: "openrouter", costPerInputToken: 0.79, costPerOutputToken: 0.79, contextWindow: 131072 },
      { id: "nousresearch/hermes-3-llama-3.1-70b", provider: "openrouter", costPerInputToken: 0.12, costPerOutputToken: 0.30, contextWindow: 128000 },

      // Microsoft
      { id: "microsoft/phi-4", provider: "openrouter", costPerInputToken: 0.05, costPerOutputToken: 0.05, contextWindow: 16384 },
      { id: "microsoft/phi-3.5-mini-128k", provider: "openrouter", costPerInputToken: 0.04, costPerOutputToken: 0.04, contextWindow: 128000 },

      // Amazon
      { id: "amazon/nova-pro-v1", provider: "openrouter", costPerInputToken: 0.80, costPerOutputToken: 3.20, contextWindow: 128000 },
      { id: "amazon/nova-lite-v1", provider: "openrouter", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 128000 },

      // Perplexity
      { id: "perplexity/sonar-pro", provider: "openrouter", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 127000 },
      { id: "perplexity/sonar", provider: "openrouter", costPerInputToken: 1.00, costPerOutputToken: 1.00, contextWindow: 127000 },
      { id: "perplexity/sonar-reasoning", provider: "openrouter", costPerInputToken: 1.00, costPerOutputToken: 5.00, contextWindow: 127000 },

      // Liquid
      { id: "liquid/lfm-40b", provider: "openrouter", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 32768 },

      // Allen AI
      { id: "allenai/olmo-2-13b", provider: "openrouter", costPerInputToken: 0.05, costPerOutputToken: 0.05, contextWindow: 4096 },

      // Upstage
      { id: "upstage/solar-pro-preview", provider: "openrouter", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 4096 },

      // Cognitive Computations
      { id: "cognitivecomputations/dolphin3.0-r1-mistral-24b", provider: "openrouter", costPerInputToken: 0.15, costPerOutputToken: 0.20, contextWindow: 32768 },

      // DeepHermes
      { id: "deephermes/deephermes-3-preview-llama-3-8b", provider: "openrouter", costPerInputToken: 0.05, costPerOutputToken: 0.05, contextWindow: 8192 },
    ],
  },
  {
    id: "groq",
    name: "Groq (LPU Inference)",
    apiKeyEnv: "GROQ_API_KEY",
    apiKeyHint: "from console.groq.com",
    baseUrl: "https://api.groq.com/openai/v1",
    models: [
      { id: "llama-3.3-70b-versatile", provider: "groq", costPerInputToken: 0.59, costPerOutputToken: 0.79, contextWindow: 128000 },
      { id: "llama-3.1-8b-instant", provider: "groq", costPerInputToken: 0.05, costPerOutputToken: 0.08, contextWindow: 131072 },
      { id: "llama-4-scout-17b-16e-instruct", provider: "groq", costPerInputToken: 0.13, costPerOutputToken: 0.13, contextWindow: 10000000 },
      { id: "llama-4-maverick-17b-128e-instruct", provider: "groq", costPerInputToken: 0.15, costPerOutputToken: 0.15, contextWindow: 10000000 },
      { id: "deepseek-r1-distill-llama-70b", provider: "groq", costPerInputToken: 0.75, costPerOutputToken: 0.99, contextWindow: 128000 },
      { id: "mixtral-8x7b-32768", provider: "groq", costPerInputToken: 0.24, costPerOutputToken: 0.24, contextWindow: 32768 },
      { id: "gemma2-9b-it", provider: "groq", costPerInputToken: 0.20, costPerOutputToken: 0.20, contextWindow: 8192 },
    ],
  },
  {
    id: "together",
    name: "Together AI",
    apiKeyEnv: "TOGETHER_API_KEY",
    apiKeyHint: "from api.together.ai",
    baseUrl: "https://api.together.xyz/v1",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", provider: "together", costPerInputToken: 0.88, costPerOutputToken: 0.88, contextWindow: 128000 },
      { id: "meta-llama/Llama-3.1-8B-Instruct-Turbo", provider: "together", costPerInputToken: 0.18, costPerOutputToken: 0.18, contextWindow: 131072 },
      { id: "meta-llama/Llama-4-Scout-17B-16E-Instruct", provider: "together", costPerInputToken: 0.13, costPerOutputToken: 0.13, contextWindow: 10000000 },
      { id: "meta-llama/Llama-4-Maverick-17B-128E-Instruct", provider: "together", costPerInputToken: 0.15, costPerOutputToken: 0.15, contextWindow: 10000000 },
      { id: "deepseek-ai/DeepSeek-V3", provider: "together", costPerInputToken: 0.27, costPerOutputToken: 1.10, contextWindow: 128000 },
      { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", provider: "together", costPerInputToken: 0.65, costPerOutputToken: 0.65, contextWindow: 65536 },
      { id: "Qwen/Qwen2.5-72B-Instruct-Turbo", provider: "together", costPerInputToken: 0.35, costPerOutputToken: 0.40, contextWindow: 131072 },
      { id: "google/gemma-2-27b-it", provider: "together", costPerInputToken: 0.27, costPerOutputToken: 0.27, contextWindow: 8192 },
    ],
  },
  {
    id: "fireworks",
    name: "Fireworks AI",
    apiKeyEnv: "FIREWORKS_API_KEY",
    apiKeyHint: "from fireworks.ai",
    baseUrl: "https://api.fireworks.ai/inference/v1",
    models: [
      { id: "accounts/fireworks/models/llama-v3p3-70b-instruct", provider: "fireworks", costPerInputToken: 0.90, costPerOutputToken: 0.90, contextWindow: 128000 },
      { id: "accounts/fireworks/models/llama-v3p1-8b-instruct", provider: "fireworks", costPerInputToken: 0.20, costPerOutputToken: 0.20, contextWindow: 131072 },
      { id: "accounts/fireworks/models/deepseek-r1", provider: "fireworks", costPerInputToken: 2.00, costPerOutputToken: 2.00, contextWindow: 128000 },
      { id: "accounts/fireworks/models/qwen2p5-coder-32b-instruct", provider: "fireworks", costPerInputToken: 0.80, costPerOutputToken: 0.80, contextWindow: 131072 },
      { id: "accounts/fireworks/models/mixtral-8x22b-instruct", provider: "fireworks", costPerInputToken: 0.12, costPerOutputToken: 0.12, contextWindow: 65536 },
    ],
  },
  {
    id: "mistral",
    name: "Mistral",
    apiKeyEnv: "MISTRAL_API_KEY",
    apiKeyHint: "from console.mistral.ai",
    baseUrl: "https://api.mistral.ai/v1",
    models: [
      { id: "mistral-large-2411", provider: "mistral", costPerInputToken: 2.00, costPerOutputToken: 6.00, contextWindow: 128000 },
      { id: "mistral-small-2501", provider: "mistral", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 32000 },
      { id: "mistral-saba-2502", provider: "mistral", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 32000 },
      { id: "codestral-2501", provider: "mistral", costPerInputToken: 1.00, costPerOutputToken: 3.00, contextWindow: 256000 },
      { id: "ministral-8b-2410", provider: "mistral", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 128000 },
      { id: "mistral-embed", provider: "mistral", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 8192 },
    ],
  },
  {
    id: "perplexity",
    name: "Perplexity (Web Search)",
    apiKeyEnv: "PERPLEXITY_API_KEY",
    apiKeyHint: "from perplexity.ai",
    baseUrl: "https://api.perplexity.ai",
    models: [
      { id: "sonar-pro", provider: "perplexity", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 127000 },
      { id: "sonar", provider: "perplexity", costPerInputToken: 1.00, costPerOutputToken: 1.00, contextWindow: 127000 },
      { id: "sonar-deep-research", provider: "perplexity", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 127000 },
      { id: "sonar-reasoning", provider: "perplexity", costPerInputToken: 1.00, costPerOutputToken: 5.00, contextWindow: 127000 },
      { id: "sonar-pro-vision", provider: "perplexity", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 127000 },
    ],
  },
  {
    id: "cerebras",
    name: "Cerebras",
    apiKeyEnv: "CEREBRAS_API_KEY",
    apiKeyHint: "from cloud.cerebras.ai",
    baseUrl: "https://api.cerebras.ai/v1",
    models: [
      { id: "cerebras-llama-3.3-70b", provider: "cerebras", costPerInputToken: 0.60, costPerOutputToken: 0.60, contextWindow: 8192 },
      { id: "cerebras-llama-3.1-8b", provider: "cerebras", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 8192 },
    ],
  },
  {
    id: "deepinfra",
    name: "DeepInfra",
    apiKeyEnv: "DEEPINFRA_API_KEY",
    apiKeyHint: "from deepinfra.com",
    baseUrl: "https://api.deepinfra.com/v1/openai",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct-Turbo", provider: "deepinfra", costPerInputToken: 0.38, costPerOutputToken: 0.58, contextWindow: 128000 },
      { id: "meta-llama/Llama-3.1-8B-Instruct", provider: "deepinfra", costPerInputToken: 0.08, costPerOutputToken: 0.08, contextWindow: 131072 },
      { id: "Qwen/Qwen2.5-72B-Instruct", provider: "deepinfra", costPerInputToken: 0.35, costPerOutputToken: 0.40, contextWindow: 131072 },
      { id: "mistralai/Mixtral-8x22B-Instruct-v0.1", provider: "deepinfra", costPerInputToken: 0.52, costPerOutputToken: 0.52, contextWindow: 65536 },
    ],
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    apiKeyEnv: "GITHUB_TOKEN",
    apiKeyHint: "gh token with copilot scope",
    baseUrl: "https://api.githubcopilot.com",
    models: [
      { id: "copilot-gpt-4o", provider: "github-copilot", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "copilot-claude-sonnet", provider: "github-copilot", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 200000 },
    ],
  },
  {
    id: "ollama",
    name: "Ollama (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed -- runs locally",
    baseUrl: "http://localhost:11434",
    models: [
      { id: "llama3", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 8192 },
      { id: "codellama", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 16384 },
      { id: "deepseek-coder", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "qwen2.5-coder", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
      { id: "phi4", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 16384 },
      { id: "mistral", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
      { id: "llama3.2", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "llama3.2-vision", provider: "ollama", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
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
    id: "vllm",
    name: "vLLM (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed -- runs locally",
    baseUrl: "http://localhost:8000",
    models: [
      { id: "default", provider: "vllm", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 131072 },
    ],
  },
  {
    id: "sglang",
    name: "SGLang (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed -- runs locally",
    baseUrl: "http://localhost:30000",
    models: [
      { id: "default", provider: "sglang", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 131072 },
    ],
  },
  {
    id: "inferrs",
    name: "Inferrs (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed -- runs locally",
    baseUrl: "http://localhost:8080",
    models: [
      { id: "default", provider: "inferrs", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
    ],
  },
  {
    id: "ds4",
    name: "DeepSeek V4 (Local)",
    apiKeyEnv: "",
    apiKeyHint: "No key needed -- runs locally",
    baseUrl: "http://localhost:8080",
    models: [
      { id: "deepseek-v4", provider: "ds4", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
    ],
  },
  {
    id: "azure",
    name: "Azure OpenAI",
    apiKeyEnv: "AZURE_OPENAI_API_KEY",
    apiKeyHint: "Also set AZURE_OPENAI_ENDPOINT",
    baseUrl: "",
    models: [
      { id: "gpt-4o", provider: "azure", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "gpt-4o-mini", provider: "azure", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 128000 },
      { id: "gpt-4.1", provider: "azure", costPerInputToken: 2.00, costPerOutputToken: 8.00, contextWindow: 1000000 },
    ],
  },
  {
    id: "alibaba",
    name: "Alibaba Model Studio (Qwen)",
    apiKeyEnv: "ALIBABA_API_KEY",
    apiKeyHint: "from dashscope.aliyun.com",
    baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
    models: [
      { id: "qwen-max", provider: "alibaba", costPerInputToken: 1.60, costPerOutputToken: 6.40, contextWindow: 32768 },
      { id: "qwen-plus", provider: "alibaba", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 131072 },
      { id: "qwen-turbo", provider: "alibaba", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 131072 },
      { id: "qwen2.5-coder-32b-instruct", provider: "alibaba", costPerInputToken: 0.35, costPerOutputToken: 0.40, contextWindow: 131072 },
    ],
  },
  {
    id: "amazon-bedrock",
    name: "Amazon Bedrock",
    apiKeyEnv: "AWS_ACCESS_KEY_ID",
    apiKeyHint: "Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION",
    baseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    models: [
      { id: "anthropic.claude-sonnet-4-20250514", provider: "amazon-bedrock", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "anthropic.claude-3-5-haiku-20241022", provider: "amazon-bedrock", costPerInputToken: 0.80, costPerOutputToken: 4.00, contextWindow: 200000 },
      { id: "meta.llama3-70b-instruct-v1", provider: "amazon-bedrock", costPerInputToken: 1.95, costPerOutputToken: 2.56, contextWindow: 8192 },
      { id: "amazon.nova-pro-v1", provider: "amazon-bedrock", costPerInputToken: 0.80, costPerOutputToken: 3.20, contextWindow: 128000 },
      { id: "amazon.nova-lite-v1", provider: "amazon-bedrock", costPerInputToken: 0.20, costPerOutputToken: 0.60, contextWindow: 128000 },
    ],
  },
  {
    id: "bedrock-mantle",
    name: "Amazon Bedrock Mantle",
    apiKeyEnv: "AWS_ACCESS_KEY_ID",
    apiKeyHint: "Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION",
    baseUrl: "https://bedrock-runtime.{region}.amazonaws.com",
    models: [
      { id: "us.meta.llama4-maverick-17b-128e-instruct-v1", provider: "bedrock-mantle", costPerInputToken: 0.15, costPerOutputToken: 0.15, contextWindow: 10000000 },
      { id: "us.meta.llama4-scout-17b-16e-instruct-v1", provider: "bedrock-mantle", costPerInputToken: 0.13, costPerOutputToken: 0.13, contextWindow: 10000000 },
      { id: "us.deepseek.r1-v1", provider: "bedrock-mantle", costPerInputToken: 1.00, costPerOutputToken: 5.00, contextWindow: 128000 },
    ],
  },
  {
    id: "arcee",
    name: "Arcee AI (Trinity)",
    apiKeyEnv: "ARCEE_API_KEY",
    apiKeyHint: "from arcee.ai",
    baseUrl: "https://api.arcee.ai/v1",
    models: [
      { id: "trinity-7b", provider: "arcee", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 8192 },
      { id: "trinity-70b", provider: "arcee", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 32768 },
    ],
  },
  {
    id: "byteplus",
    name: "BytePlus (International)",
    apiKeyEnv: "BYTEPLUS_API_KEY",
    apiKeyHint: "from console.byteplus.com",
    baseUrl: "https://ark.cn-beijing.byteapis.com/api/v3",
    models: [
      { id: "doubao-pro-32k", provider: "byteplus", costPerInputToken: 0.80, costPerOutputToken: 2.00, contextWindow: 32768 },
      { id: "doubao-lite-128k", provider: "byteplus", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 128000 },
    ],
  },
  {
    id: "chutes",
    name: "Chutes",
    apiKeyEnv: "CHUTES_API_KEY",
    apiKeyHint: "from chutes.ai",
    baseUrl: "https://api.chutes.ai/v1",
    models: [
      { id: "chutes-llama-3.3-70b", provider: "chutes", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 128000 },
    ],
  },
  {
    id: "cloudflare",
    name: "Cloudflare AI Gateway",
    apiKeyEnv: "CLOUDFLARE_API_TOKEN",
    apiKeyHint: "from cloudflare.com",
    baseUrl: "https://gateway.ai.cloudflare.com/v1",
    models: [
      { id: "@cf/meta/llama-3.3-70b-instruct", provider: "cloudflare", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
    ],
  },
  {
    id: "gradium",
    name: "Gradium",
    apiKeyEnv: "GRADIUM_API_KEY",
    apiKeyHint: "from gradium.ai",
    baseUrl: "https://api.gradium.ai/v1",
    models: [
      { id: "gradium-llama-3.3-70b", provider: "gradium", costPerInputToken: 0.40, costPerOutputToken: 0.40, contextWindow: 128000 },
    ],
  },
  {
    id: "huggingface",
    name: "Hugging Face Inference",
    apiKeyEnv: "HF_API_TOKEN",
    apiKeyHint: "from huggingface.co/settings/tokens",
    baseUrl: "https://api-inference.huggingface.co/v1",
    models: [
      { id: "meta-llama/Llama-3.3-70B-Instruct", provider: "huggingface", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", provider: "huggingface", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 32768 },
      { id: "Qwen/Qwen2.5-72B-Instruct", provider: "huggingface", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 131072 },
    ],
  },
  {
    id: "kilocode",
    name: "Kilocode",
    apiKeyEnv: "KILOCODE_API_KEY",
    apiKeyHint: "from kilocode.ai",
    baseUrl: "https://api.kilocode.ai/v1",
    models: [
      { id: "kilocode-default", provider: "kilocode", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 128000 },
    ],
  },
  {
    id: "litellm",
    name: "LiteLLM (Unified Gateway)",
    apiKeyEnv: "LITELLM_API_KEY",
    apiKeyHint: "Optional key for your LiteLLM proxy",
    baseUrl: "http://localhost:4000",
    models: [
      { id: "gpt-4o", provider: "litellm", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "claude-sonnet-4-20250514", provider: "litellm", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
    ],
  },
  {
    id: "minimax",
    name: "MiniMax",
    apiKeyEnv: "MINIMAX_API_KEY",
    apiKeyHint: "from minimax.com",
    baseUrl: "https://api.minimax.chat/v1",
    models: [
      { id: "minimax-text-01", provider: "minimax", costPerInputToken: 0.20, costPerOutputToken: 1.00, contextWindow: 128000 },
      { id: "minimax-abab-7b", provider: "minimax", costPerInputToken: 0.10, costPerOutputToken: 0.50, contextWindow: 32768 },
    ],
  },
  {
    id: "moonshot",
    name: "Moonshot AI (Kimi)",
    apiKeyEnv: "MOONSHOT_API_KEY",
    apiKeyHint: "from moonshot.cn",
    baseUrl: "https://api.moonshot.cn/v1",
    models: [
      { id: "kimi-k2", provider: "moonshot", costPerInputToken: 2.00, costPerOutputToken: 8.00, contextWindow: 128000 },
      { id: "moonshot-v1-32k", provider: "moonshot", costPerInputToken: 0.60, costPerOutputToken: 2.40, contextWindow: 32768 },
      { id: "moonshot-v1-128k", provider: "moonshot", costPerInputToken: 1.20, costPerOutputToken: 4.80, contextWindow: 128000 },
    ],
  },
  {
    id: "nvidia",
    name: "NVIDIA NIM",
    apiKeyEnv: "NVIDIA_API_KEY",
    apiKeyHint: "from build.nvidia.com",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    models: [
      { id: "meta/llama-3.3-70b-instruct", provider: "nvidia", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 128000 },
      { id: "mistralai/mistral-large", provider: "nvidia", costPerInputToken: 2.00, costPerOutputToken: 6.00, contextWindow: 128000 },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", provider: "nvidia", costPerInputToken: 0, costPerOutputToken: 0, contextWindow: 131072 },
    ],
  },
  {
    id: "qianfan",
    name: "Qianfan (Baidu)",
    apiKeyEnv: "QIANFAN_API_KEY",
    apiKeyHint: "Set QIANFAN_API_KEY and QIANFAN_SECRET_KEY",
    baseUrl: "https://qianfan.baidubce.com/v2",
    models: [
      { id: "ernie-4.0", provider: "qianfan", costPerInputToken: 1.20, costPerOutputToken: 4.80, contextWindow: 128000 },
      { id: "ernie-3.5", provider: "qianfan", costPerInputToken: 0.60, costPerOutputToken: 2.40, contextWindow: 128000 },
    ],
  },
  {
    id: "qwen-cloud",
    name: "Qwen Cloud",
    apiKeyEnv: "QWEN_CLOUD_API_KEY",
    apiKeyHint: "from qwen.cloud",
    baseUrl: "https://dashscope.aliyuncs.com/api/v1",
    models: [
      { id: "qwen-max-0422", provider: "qwen-cloud", costPerInputToken: 1.60, costPerOutputToken: 6.40, contextWindow: 32768 },
      { id: "qwen-plus-0422", provider: "qwen-cloud", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 131072 },
    ],
  },
  {
    id: "stepfun",
    name: "StepFun (Step-2)",
    apiKeyEnv: "STEPFUN_API_KEY",
    apiKeyHint: "from stepfun.com",
    baseUrl: "https://api.stepfun.com/v1",
    models: [
      { id: "step-2-16k", provider: "stepfun", costPerInputToken: 0.50, costPerOutputToken: 2.00, contextWindow: 16384 },
      { id: "step-1-8k", provider: "stepfun", costPerInputToken: 0.20, costPerOutputToken: 1.00, contextWindow: 8192 },
    ],
  },
  {
    id: "synthetic",
    name: "Synthetic",
    apiKeyEnv: "SYNTHETIC_API_KEY",
    apiKeyHint: "from synthetic.com",
    baseUrl: "https://api.synthetic.com/v1",
    models: [
      { id: "synthetic-default", provider: "synthetic", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 32768 },
    ],
  },
  {
    id: "tencent",
    name: "Tencent Cloud (TokenHub)",
    apiKeyEnv: "TENCENT_API_KEY",
    apiKeyHint: "Set TENCENT_API_KEY and TENCENT_SECRET_ID",
    baseUrl: "https://api.tokenhub.cloud/v1",
    models: [
      { id: "hunyuan-large", provider: "tencent", costPerInputToken: 0.80, costPerOutputToken: 2.40, contextWindow: 128000 },
      { id: "hunyuan-standard", provider: "tencent", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 128000 },
    ],
  },
  {
    id: "venice",
    name: "Venice AI (Privacy)",
    apiKeyEnv: "VENICE_API_KEY",
    apiKeyHint: "from venice.ai",
    baseUrl: "https://api.venice.ai/api/v1",
    models: [
      { id: "venice-llama-3.3-70b", provider: "venice", costPerInputToken: 0.30, costPerOutputToken: 0.30, contextWindow: 128000 },
      { id: "venice-dolphin-72b", provider: "venice", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 32768 },
    ],
  },
  {
    id: "vercel",
    name: "Vercel AI Gateway",
    apiKeyEnv: "VERCEL_API_TOKEN",
    apiKeyHint: "From vercel.com -- use VERCEL_AI_GATEWAY_URL for custom endpoint",
    baseUrl: "https://gateway.vercel.ai/v1",
    models: [
      { id: "openai/gpt-4o", provider: "vercel", costPerInputToken: 2.50, costPerOutputToken: 10.00, contextWindow: 128000 },
      { id: "anthropic/claude-sonnet-4-20250514", provider: "vercel", costPerInputToken: 3.00, costPerOutputToken: 15.00, contextWindow: 200000 },
      { id: "google/gemini-2.5-flash", provider: "vercel", costPerInputToken: 0.15, costPerOutputToken: 0.60, contextWindow: 1000000 },
    ],
  },
  {
    id: "volcengine",
    name: "Volcengine (Doubao)",
    apiKeyEnv: "VOLC_ACCESS_KEY",
    apiKeyHint: "Set VOLC_ACCESS_KEY and VOLC_SECRET_KEY",
    baseUrl: "https://ark.cn-beijing.volces.com/api/v3",
    models: [
      { id: "doubao-pro-32k", provider: "volcengine", costPerInputToken: 0.80, costPerOutputToken: 2.00, contextWindow: 32768 },
      { id: "doubao-pro-128k", provider: "volcengine", costPerInputToken: 1.60, costPerOutputToken: 4.00, contextWindow: 128000 },
      { id: "doubao-lite-128k", provider: "volcengine", costPerInputToken: 0.40, costPerOutputToken: 1.20, contextWindow: 128000 },
    ],
  },
  {
    id: "vydra",
    name: "Vydra",
    apiKeyEnv: "VYDRA_API_KEY",
    apiKeyHint: "from vydra.ai",
    baseUrl: "https://api.vydra.ai/v1",
    models: [
      { id: "vydra-default", provider: "vydra", costPerInputToken: 0.50, costPerOutputToken: 0.50, contextWindow: 128000 },
    ],
  },
  {
    id: "xiaomi",
    name: "Xiaomi AI",
    apiKeyEnv: "XIAOMI_API_KEY",
    apiKeyHint: "from xiaomi.ai",
    baseUrl: "https://api.xiaomi.com/v1",
    models: [
      { id: "mi-llama-70b", provider: "xiaomi", costPerInputToken: 0.40, costPerOutputToken: 0.40, contextWindow: 32768 },
    ],
  },
  {
    id: "zai",
    name: "Z.AI (GLM / Zhipu)",
    apiKeyEnv: "ZHIPU_API_KEY",
    apiKeyHint: "from zhipuai.cn",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    models: [
      { id: "glm-4-plus", provider: "zai", costPerInputToken: 0.50, costPerOutputToken: 2.00, contextWindow: 128000 },
      { id: "glm-4-flash", provider: "zai", costPerInputToken: 0.10, costPerOutputToken: 0.10, contextWindow: 128000 },
      { id: "glm-4v-plus", provider: "zai", costPerInputToken: 0.50, costPerOutputToken: 2.00, contextWindow: 128000 },
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
