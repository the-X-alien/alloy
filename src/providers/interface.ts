export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  costPerInputToken: number;  // per 1M tokens USD
  costPerOutputToken: number; // per 1M tokens USD
  contextWindow: number;
}

export interface ProviderConfig {
  id: string;
  name: string;
  apiKeyEnv: string;
  baseUrl?: string;
  models: ModelConfig[];
}

export interface ChatMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  model?: string;
  cost?: number;
  timestamp: number;
  toolCalls?: { id?: string; name: string; arguments: Record<string, unknown> }[];
  toolName?: string;
}

export interface ChatOptions {
  model: string;
  system?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
  tools?: Record<string, unknown>[];
}

export interface Provider {
  id: string;
  name: string;
  configured: boolean;
  chat(messages: ChatMessage[], opts: ChatOptions): AsyncIterable<string>;
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
}
