import type { MemoryManager } from "../memory/manager.js";
import type { SkillManager } from "../skill/manager.js";
import type { SessionStore } from "../session/store.js";

export interface ReviewConfig {
  enabled: boolean;
  memoryThreshold: number;
  minTurns: number;
}

export class ReviewAgent {
  private running = false;

  constructor(
    private memoryManager: MemoryManager,
    private skillManager: SkillManager,
    private config: ReviewConfig,
  ) { }

  async reviewSession(sessionId: string, store: SessionStore): Promise<void> {
    if (!this.config.enabled || this.running) return;

    const session = store.get(sessionId);
    if (!session || session.messageCount < this.config.minTurns) return;

    this.running = true;

    try {
      const messages = store.getMessages(sessionId, 10);
      if (messages.length < 2) return;

      const recentTurn = messages.slice(-2);
      const userMsg = recentTurn.find(m => m.role === "user")?.content ?? "";
      const assistantMsg = recentTurn.find(m => m.role === "assistant")?.content ?? "";

      if (assistantMsg.length > 500) {
        const memoryEntry = {
          sessionId: sessionId,
          content: `Session insight: ${assistantMsg.slice(0, 300)}`,
          tags: ["reviewed", "session-insight"],
          relevance: this.config.memoryThreshold,
          accessedAt: Date.now(),
          source: "agent" as const,
        };
        this.memoryManager.save(memoryEntry);
      }
    } finally {
      this.running = false;
    }
  }
}
