import { SessionStore } from "./store.js";
import { SessionSearch } from "./search.js";
import { ContextCompressor } from "./compression.js";
import { createSnapshot } from "./snapshot.js";
import type { SessionMeta, SessionStatus } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";

export class SessionManager {
  private store = new SessionStore();
  private search = new SessionSearch();
  private compressor = new ContextCompressor();
  private currentId: string | null = null;

  get current(): SessionMeta | null {
    if (!this.currentId) return null;
    return this.store.get(this.currentId);
  }

  get all(): SessionMeta[] {
    return this.store.getAll();
  }

  create(model: string, provider: string, title?: string): SessionMeta {
    const session = this.store.create(model, provider, title);
    this.currentId = session.id;
    return session;
  }

  switchTo(id: string): boolean {
    const exists = this.store.get(id);
    if (exists) {
      this.currentId = id;
      return true;
    }
    return false;
  }

  delete(id: string): void {
    this.store.delete(id);
    if (this.currentId === id) {
      const all = this.store.getAll();
      this.currentId = all.length > 0 ? all[0].id : null;
    }
  }

  addMessage(msg: ChatMessage): void {
    if (!this.currentId) return;
    this.store.addMessage(this.currentId, msg);
  }

  getMessages(): ChatMessage[] {
    if (!this.currentId) return [];
    return this.store.getMessages(this.currentId);
  }

  update(updates: Partial<SessionMeta>): void {
    if (!this.currentId) return;
    this.store.update(this.currentId, updates);
  }

  searchSessions(query: string): SessionMeta[] {
    return this.store.search(query);
  }

  searchMessages(query: string) {
    return this.search.search(query);
  }

  snapshot() {
    if (!this.currentId) return null;
    const session = this.current;
    return createSnapshot(this.currentId, session?.messageCount ?? 0);
  }

  shouldCompact(threshold: number): boolean {
    if (!this.currentId) return false;
    const session = this.current;
    return this.compressor.shouldCompact(session?.messageCount ?? 0, threshold);
  }
}
