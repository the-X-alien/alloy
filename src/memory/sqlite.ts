import { getDb } from "../db/connection.js";
import type { MemoryEntry } from "./types.js";
import type { MemoryProvider } from "./provider.js";
import type { ToolSchema } from "../types.js";

export class SQLiteMemoryProvider implements MemoryProvider {
  readonly name = "sqlite";
  private currentSessionId = "";

  initialize(sessionId: string): void {
    this.currentSessionId = sessionId;
  }

  prefetch(query: string): string {
    const results = this.search(query, 5);
    if (results.length === 0) return "";
    const lines = results.map(e => `- ${e.content} (${e.tags.join(", ")})`);
    return `<memory-context>\n${lines.join("\n")}\n</memory-context>`;
  }

  syncTurn(userMessage: string, assistantMessage: string): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO memory (session_id, content, tags, created_at, accessed_at, source)
      VALUES (?, ?, ?, ?, ?, 'agent')
    `).run(
      this.currentSessionId,
      `Q: ${truncate(userMessage, 200)}\nA: ${truncate(assistantMessage, 200)}`,
      "conversation",
      Date.now(),
      Date.now()
    );
  }

  getToolSchemas(): ToolSchema[] {
    return [
      {
        name: "save_memory",
        description: "Save an important fact to persistent memory",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string" },
            tags: { type: "array", items: { type: "string" } },
          },
          required: ["content"],
        },
      },
      {
        name: "search_memory",
        description: "Full-text search across all memories",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
          },
          required: ["query"],
        },
      },
    ];
  }

  handleToolCall(name: string, args: Record<string, unknown>): string {
    const db = getDb();
    switch (name) {
      case "save_memory": {
        db.prepare(`
          INSERT INTO memory (session_id, content, tags, created_at, accessed_at, source)
          VALUES (?, ?, ?, ?, ?, 'agent')
        `).run(
          this.currentSessionId,
          String(args.content ?? ""),
          Array.isArray(args.tags) ? args.tags.join(",") : "",
          Date.now(),
          Date.now()
        );
        return "Memory saved to persistent store.";
      }
      case "search_memory": {
        const query = String(args.query ?? "");
        const rows = db.prepare(`
          SELECT content, tags, relevance FROM memory_fts
          JOIN memory ON memory.id = memory_fts.rowid
          WHERE memory_fts MATCH ?
          ORDER BY rank
          LIMIT 5
        `).all(query) as any[];
        if (rows.length === 0) return "No relevant memories found.";
        return rows.map((r: any) => `[${r.relevance.toFixed(2)}] ${r.content}`).join("\n");
      }
      default:
        return `Unknown memory tool: ${name}`;
    }
  }

  search(query: string, limit = 10): MemoryEntry[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM memory
      WHERE content LIKE ? OR tags LIKE ?
      ORDER BY accessed_at DESC
      LIMIT ?
    `).all(`%${query}%`, `%${query}%`, limit) as any[];
    return rows.map(r => ({
      id: r.id,
      sessionId: r.session_id,
      content: r.content,
      tags: (r.tags ?? "").split(",").filter(Boolean),
      relevance: r.relevance ?? 0.5,
      createdAt: r.created_at,
      accessedAt: r.accessed_at,
      source: r.source,
    }));
  }

  save(entry: Omit<MemoryEntry, "id" | "createdAt">): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO memory (session_id, content, tags, relevance, created_at, accessed_at, source)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.sessionId ?? this.currentSessionId,
      entry.content,
      entry.tags.join(","),
      entry.relevance,
      Date.now(),
      entry.accessedAt ?? Date.now(),
      entry.source
    );
  }

  shutdown(): void { }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "...";
}
