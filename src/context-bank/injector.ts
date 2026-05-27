import type { ContextEntry } from "./types.js";
import type { ContextBankManager } from "./manager.js";

export class ContextInjector {
  constructor(private manager: ContextBankManager) { }

  inject(userMessage: string): string {
    const matched = this.findMatches(userMessage);
    if (matched.length === 0) return "";

    const blocks = matched.map(entry => {
      this.manager.recordUsage(entry.name);
      return `<context-bank name="${entry.name}">\n${entry.content}\n</context-bank>`;
    });

    return `\n${blocks.join("\n\n")}\n`;
  }

  private findMatches(userMessage: string): ContextEntry[] {
    const exact = this.matchByTagOrPattern(userMessage);
    if (exact.length > 0) return exact;

    return this.manager.autoSuggest(userMessage, 2);
  }

  private matchByTagOrPattern(userMessage: string): ContextEntry[] {
    const all = this.manager.getAll();
    const matched: ContextEntry[] = [];

    for (const entry of all) {
      if (entry.triggerPattern && this.matchesPattern(userMessage, entry.triggerPattern)) {
        matched.push(entry);
        continue;
      }

      if (entry.tags.some(tag => userMessage.toLowerCase().includes(tag.toLowerCase()))) {
        if (!matched.includes(entry)) matched.push(entry);
      }
    }

    return matched;
  }

  private matchesPattern(text: string, pattern: string): boolean {
    try {
      const regex = new RegExp(pattern, "i");
      return regex.test(text);
    } catch {
      return text.toLowerCase().includes(pattern.toLowerCase());
    }
  }
}
