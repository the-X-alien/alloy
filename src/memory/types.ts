export interface MemoryEntry {
  id?: number;
  sessionId?: string;
  content: string;
  tags: string[];
  relevance: number;
  createdAt: number;
  accessedAt?: number;
  source: "agent" | "user" | "imported";
}

export interface MemoryProviderConfig {
  name: string;
  enabled: boolean;
}
