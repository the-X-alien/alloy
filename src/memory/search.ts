import type { MemoryEntry } from "./types.js";

export interface ScoredMemory extends MemoryEntry {
  score: number;
}

export class MemorySearch {
  search(entries: MemoryEntry[], query: string, limit = 10): ScoredMemory[] {
    const q = query.toLowerCase();
    const terms = q.split(/\s+/).filter(Boolean);

    const scored = entries
      .map(e => ({
        ...e,
        score: this.computeScore(e, terms),
      }))
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return scored;
  }

  private computeScore(entry: MemoryEntry, terms: string[]): number {
    let score = 0;

    for (const term of terms) {
      if (entry.content.toLowerCase().includes(term)) score += 0.3;
      for (const tag of entry.tags) {
        if (tag.toLowerCase().includes(term)) score += 0.2;
      }
    }

    score *= entry.relevance;

    const ageHours = (Date.now() - entry.createdAt) / (1000 * 60 * 60);
    score *= Math.max(0.3, 1 - ageHours / 720);

    return score;
  }
}
