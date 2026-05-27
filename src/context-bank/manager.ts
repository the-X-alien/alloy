import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { ContextEntry } from "./types.js";
import { readJSON, writeJSON, ensureDir } from "../util/fs.js";

const CONTEXT_BANKS_FILE = path.join(os.homedir(), ".alloy", "context-banks.json");

export class ContextBankManager {
  private entries: ContextEntry[] = [];

  constructor() {
    this.load();
  }

  getAll(): ContextEntry[] {
    return [...this.entries];
  }

  get(name: string): ContextEntry | undefined {
    return this.entries.find(e => e.name === name);
  }

  save(entry: Omit<ContextEntry, "id" | "createdAt" | "usageCount">): ContextEntry {
    const existing = this.entries.findIndex(e => e.name === entry.name);
    const now = Date.now();

    if (existing >= 0) {
      this.entries[existing] = {
        ...this.entries[existing],
        ...entry,
        updatedAt: now,
      };
      this.persist();
      return this.entries[existing];
    }

    const newEntry: ContextEntry = {
      ...entry,
      id: this.entries.length + 1,
      createdAt: now,
      usageCount: 0,
    };
    this.entries.push(newEntry);
    this.persist();
    return newEntry;
  }

  delete(name: string): boolean {
    const idx = this.entries.findIndex(e => e.name === name);
    if (idx < 0) return false;
    this.entries.splice(idx, 1);
    this.persist();
    return true;
  }

  search(query: string): ContextEntry[] {
    const q = query.toLowerCase();
    return this.entries.filter(e =>
      e.name.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.tags.some(t => t.toLowerCase().includes(q))
    );
  }

  autoSuggest(userMessage: string, maxResults = 3): ContextEntry[] {
    const lower = userMessage.toLowerCase();
    const scored = this.entries.map(entry => {
      let score = 0;

      if ((entry.usageCount ?? 0) > 0) {
        score += Math.min(entry.usageCount / 10, 1) * 3;
      }

      const recency = entry.updatedAt ?? entry.createdAt;
      const hoursAgo = (Date.now() - recency) / 36e5;
      if (hoursAgo < 24) score += 2;
      else if (hoursAgo < 168) score += 1;

      for (const tag of entry.tags) {
        if (lower.includes(tag.toLowerCase())) {
          score += 1.5;
        }
      }

      if (entry.triggerPattern) {
        try {
          if (new RegExp(entry.triggerPattern, "i").test(lower)) score += 3;
        } catch {
          if (lower.includes(entry.triggerPattern.toLowerCase())) score += 2;
        }
      }

      for (const word of entry.name.split(/[\s_-]+/)) {
        if (word.length > 2 && lower.includes(word.toLowerCase())) score += 1;
      }

      return { entry, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults).map(s => s.entry);
  }

  recordUsage(name: string): void {
    const entry = this.entries.find(e => e.name === name);
    if (entry) {
      entry.usageCount = (entry.usageCount ?? 0) + 1;
      entry.updatedAt = Date.now();
      this.persist();
    }
  }

  private load(): void {
    const data = readJSON<ContextEntry[]>(CONTEXT_BANKS_FILE);
    if (data) this.entries = data;
  }

  private persist(): void {
    writeJSON(CONTEXT_BANKS_FILE, this.entries);
  }
}
