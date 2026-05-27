import { AgentMode } from "../types.js";
import type { ChatMessage } from "../providers/interface.js";

export interface AgentConfig {
  mode: AgentMode;
  model: string;
  provider: string;
  systemPrompt?: string;
  tools?: boolean;
  maxTurns?: number;
  skipMemory?: boolean;
  skipReview?: boolean;
}

export interface AgentResult {
  messages: ChatMessage[];
  output: string;
  model: string;
  provider: string;
  totalCost: number;
  totalTokens: number;
  turns: number;
}

export interface PlanStep {
  id: string;
  description: string;
  files?: string[];
  dependencies: string[];
  status: "pending" | "running" | "done" | "failed";
  result?: string;
}

export interface PlanArtifact {
  title: string;
  goal: string;
  steps: PlanStep[];
}

export interface AgentContext {
  config: AgentConfig;
  userMessage: string;
  messages: ChatMessage[];
  onToken: (token: string) => void;
  signal?: AbortSignal;
}
