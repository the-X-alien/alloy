export interface ModelConfig {
  id: string;
  name: string;
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
  toolCallId?: string;
}

export interface ChatOptions {
  model: string;
  system?: string;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
  tools?: Record<string, unknown>[];
}

export type StreamEvent =
  | { type: "text"; content: string }
  | { type: "tool_call_start"; id: string; name: string; }
  | { type: "tool_call_delta"; id: string; delta: string; }
  | { type: "tool_call_end"; id: string; }
  | { type: "reasoning"; content: string }
  | { type: "error"; message: string; }

export interface Provider {
  id: string;
  name: string;
  configured: boolean;
  chat(messages: ChatMessage[], opts: ChatOptions): AsyncIterable<StreamEvent>;
  estimateCost(model: string, inputTokens: number, outputTokens: number): number;
}
