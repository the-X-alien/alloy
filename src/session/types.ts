export type SessionStatus = "active" | "archived" | "compacted";

export interface SessionMeta {
  id: string;
  title: string;
  model: string;
  provider: string;
  startedAt: number;
  endedAt?: number;
  messageCount: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  branch?: string;
  projectId?: string;
  gitCommit?: string;
  parentSessionId?: string;
  status: SessionStatus;
}
