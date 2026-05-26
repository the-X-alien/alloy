export interface Session {
  id: string;
  title: string;
  model: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
  totalCost: number;
  messageCount: number;
}

export class SessionManager {
  private sessions: Session[] = [];
  private currentId: string | null = null;

  constructor() {
    this.create("Welcome");
  }

  get all() { return this.sessions; }
  get current() { return this.sessions.find(s => s.id === this.currentId) || null; }

  create(title: string = "New Session"): Session {
    const session: Session = {
      id: crypto.randomUUID(),
      title,
      model: "claude-sonnet-4-20250514",
      provider: "anthropic",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalCost: 0,
      messageCount: 0,
    };
    this.sessions.push(session);
    this.currentId = session.id;
    return session;
  }

  switchTo(id: string) {
    if (this.sessions.find(s => s.id === id)) {
      this.currentId = id;
    }
  }

  delete(id: string) {
    this.sessions = this.sessions.filter(s => s.id !== id);
    if (this.currentId === id) {
      if (this.sessions.length > 0) {
        this.currentId = this.sessions[this.sessions.length - 1].id;
      } else {
        this.currentId = this.create().id;
      }
    }
  }

  updateCurrent(updates: Partial<Session>) {
    const s = this.current;
    if (s) Object.assign(s, updates, { updatedAt: Date.now() });
  }

  addCost(amount: number) {
    const s = this.current;
    if (s) {
      s.totalCost += amount;
      s.messageCount += 1;
      s.updatedAt = Date.now();
    }
  }
}
