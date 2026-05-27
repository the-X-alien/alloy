import type { MemoryEntry } from "./types.js";
import type { ToolSchema } from "../types.js";

export interface MemoryProvider {
  readonly name: string;

  initialize(sessionId: string): void;
  prefetch(query: string): string;
  syncTurn(userMessage: string, assistantMessage: string): void;
  getToolSchemas(): ToolSchema[];
  handleToolCall(name: string, args: Record<string, unknown>): string;
  search(query: string, limit?: number): MemoryEntry[];
  save(entry: Omit<MemoryEntry, "id" | "createdAt">): void;
  shutdown(): void;
}
