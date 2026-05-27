export interface CostBreakdown {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
  sessionId?: string;
}

export class CostTracker {
  private entries: CostBreakdown[] = [];

  record(entry: CostBreakdown): void {
    this.entries.push(entry);
  }

  getHistory(): CostBreakdown[] {
    return [...this.entries];
  }

  getBySession(sessionId: string): CostBreakdown[] {
    return this.entries.filter(e => e.sessionId === sessionId);
  }

  getByProvider(provider: string): CostBreakdown[] {
    return this.entries.filter(e => e.provider === provider);
  }

  getTotalCost(): number {
    return this.entries.reduce((sum, e) => sum + e.cost, 0);
  }

  getAverageCostPerTurn(): number {
    if (this.entries.length === 0) return 0;
    return this.getTotalCost() / this.entries.length;
  }

  getProviderBreakdown(): { provider: string; cost: number; count: number }[] {
    const map = new Map<string, { cost: number; count: number }>();
    for (const e of this.entries) {
      const current = map.get(e.provider) ?? { cost: 0, count: 0 };
      current.cost += e.cost;
      current.count++;
      map.set(e.provider, current);
    }
    return Array.from(map.entries()).map(([provider, data]) => ({
      provider,
      ...data,
    }));
  }

  getModelBreakdown(): { model: string; provider: string; cost: number; count: number }[] {
    const map = new Map<string, { model: string; provider: string; cost: number; count: number }>();
    for (const e of this.entries) {
      const key = `${e.provider}/${e.model}`;
      const current = map.get(key) ?? { model: e.model, provider: e.provider, cost: 0, count: 0 };
      current.cost += e.cost;
      current.count++;
      map.set(key, current);
    }
    return Array.from(map.values());
  }

  clear(): void {
    this.entries = [];
  }
}
