import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { MemoryEntry } from "./types.js";
import type { MemoryProvider } from "./provider.js";
import type { ToolSchema } from "../types.js";

const MEMORY_DIR = path.join(os.homedir(), ".alloy", "memory");

export class BuiltinMemoryProvider implements MemoryProvider {
  readonly name = "builtin";
  private entries: MemoryEntry[] = [];
  private currentSessionId = "";
  private filePath = "";

  initialize(sessionId: string): void {
    this.currentSessionId = sessionId;
    if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
    this.filePath = path.join(MEMORY_DIR, `${sessionId}.jsonl`);
    this.load();
  }

  prefetch(query: string): string {
    const relevant = this.search(query, 5);
    if (relevant.length === 0) return "";
    const lines = relevant.map(e => `- ${e.content} (relevance: ${e.relevance.toFixed(2)})`);
    return `<memory-context>\n${lines.join("\n")}\n</memory-context>`;
  }

  syncTurn(userMessage: string, assistantMessage: string): void {
    const entry: Omit<MemoryEntry, "id" | "createdAt"> = {
      sessionId: this.currentSessionId,
      content: `Q: ${truncate(userMessage, 200)}\nA: ${truncate(assistantMessage, 200)}`,
      tags: this.extractTags(userMessage),
      relevance: 0.5,
      accessedAt: Date.now(),
      source: "agent",
    };
    this.save(entry);
  }

  getToolSchemas(): ToolSchema[] {
    return [
      {
        name: "save_memory",
        description: "Save an important fact or preference to memory for future sessions",
        inputSchema: {
          type: "object",
          properties: {
            content: { type: "string", description: "The fact or preference to remember" },
            tags: { type: "array", items: { type: "string" }, description: "Tags for categorization" },
          },
          required: ["content"],
        },
      },
      {
        name: "search_memory",
        description: "Search for relevant memories from past sessions",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Search query" },
          },
          required: ["query"],
        },
      },
    ];
  }

  handleToolCall(name: string, args: Record<string, unknown>): string {
    switch (name) {
      case "save_memory": {
        this.save({
          sessionId: this.currentSessionId,
          content: String(args.content ?? ""),
          tags: Array.isArray(args.tags) ? args.tags.map(String) : [],
          relevance: 0.8,
          accessedAt: Date.now(),
          source: "agent",
        });
        return "Memory saved.";
      }
      case "search_memory": {
        const results = this.search(String(args.query ?? ""), 5);
        if (results.length === 0) return "No relevant memories found.";
        return results.map(r => `[${r.relevance.toFixed(2)}] ${r.content}`).join("\n");
      }
      default:
        return `Unknown memory tool: ${name}`;
    }
  }

  search(query: string, limit = 10): MemoryEntry[] {
    const q = query.toLowerCase();
    const scored = this.entries
      .map(e => ({
        entry: e,
        score: this.score(e, q),
      }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored.map(s => s.entry);
  }

  save(entry: Omit<MemoryEntry, "id" | "createdAt">): void {
    const full: MemoryEntry = {
      ...entry,
      id: this.entries.length + 1,
      createdAt: Date.now(),
    };
    this.entries.unshift(full);
    this.appendToFile(full);
  }

  shutdown(): void { }

  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const lines = fs.readFileSync(this.filePath, "utf-8").split("\n").filter(Boolean);
        this.entries = lines.map(l => JSON.parse(l)).reverse();
      }
    } catch {
      this.entries = [];
    }
  }

  private appendToFile(entry: MemoryEntry): void {
    try {
      fs.appendFileSync(this.filePath, JSON.stringify(entry) + "\n", "utf-8");
    } catch { }
  }

  private score(entry: MemoryEntry, query: string): number {
    const content = entry.content.toLowerCase();
    let score = 0;
    const terms = query.split(/\s+/).filter(Boolean);
    for (const term of terms) {
      if (content.includes(term)) score += 0.2;
    }
    for (const tag of entry.tags) {
      if (tag.toLowerCase().includes(query)) score += 0.3;
    }
    score *= entry.relevance;
    const ageHours = (Date.now() - entry.createdAt) / (1000 * 60 * 60);
    score *= Math.max(0.5, 1 - ageHours / 720);
    return score;
  }

  private extractTags(text: string): string[] {
    const tags: string[] = [];
    const lower = text.toLowerCase();
    if (lower.includes("project") || lower.includes("repo")) tags.push("project");
    if (lower.includes("bug") || lower.includes("error") || lower.includes("fix")) tags.push("bug");
    if (lower.includes("config") || lower.includes("setup")) tags.push("config");
    if (lower.includes("prefer") || lower.includes("like") || lower.includes("style")) tags.push("preference");
    return tags;
  }
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + "...";
}
