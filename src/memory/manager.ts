import type { MemoryProvider } from "./provider.js";
import type { MemoryEntry } from "./types.js";
import { BuiltinMemoryProvider } from "./builtin.js";
import { SQLiteMemoryProvider } from "./sqlite.js";

export class MemoryManager {
  private providers: MemoryProvider[] = [];
  private externalProvider: MemoryProvider | null = null;

  constructor(useSQLite = false) {
    const builtin = useSQLite ? new SQLiteMemoryProvider() : new BuiltinMemoryProvider();
    this.providers.push(builtin);
  }

  setExternalProvider(provider: MemoryProvider): void {
    this.externalProvider = provider;
    this.providers = [this.providers[0]];
    if (provider) this.providers.push(provider);
  }

  initialize(sessionId: string): void {
    for (const p of this.providers) p.initialize(sessionId);
  }

  prefetch(query: string): string {
    const blocks = this.providers.map(p => p.prefetch(query)).filter(Boolean);
    return blocks.join("\n");
  }

  syncTurn(userMessage: string, assistantMessage: string): void {
    for (const p of this.providers) p.syncTurn(userMessage, assistantMessage);
  }

  getToolSchemas() {
    return this.providers.flatMap(p => p.getToolSchemas());
  }

  handleToolCall(name: string, args: Record<string, unknown>): string {
    for (const p of this.providers) {
      const result = p.handleToolCall(name, args);
      if (result) return result;
    }
    return "Memory tool not handled.";
  }

  search(query: string, limit = 10): MemoryEntry[] {
    const results = this.providers.flatMap(p => p.search(query, limit));
    const seen = new Set<string>();
    const deduped: MemoryEntry[] = [];
    for (const r of results) {
      const key = r.content.slice(0, 100);
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(r);
      }
    }
    return deduped.slice(0, limit);
  }

  save(entry: Omit<MemoryEntry, "id" | "createdAt">): void {
    for (const p of this.providers) p.save(entry);
  }

  shutdown(): void {
    for (const p of this.providers) p.shutdown();
  }
}
