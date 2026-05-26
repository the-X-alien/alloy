export interface BudgetEntry {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  timestamp: number;
}

export class CostGovernor {
  private budget: number;
  private spent: number = 0;
  private history: BudgetEntry[] = [];
  private warned: boolean = false;

  constructor(budget: number = 10.0) {
    this.budget = budget;
  }

  getBudget() { return this.budget; }
  getSpent() { return this.spent; }
  getRemaining() { return this.budget - this.spent; }
  getHistory() { return this.history; }

  setBudget(amount: number) { this.budget = amount; }
  getWarned() { return this.warned; }

  canSpend(cost: number): boolean {
    return this.spent + cost <= this.budget;
  }

  record(entry: Omit<BudgetEntry, "timestamp">) {
    this.spent += entry.cost;
    this.history.push({ ...entry, timestamp: Date.now() });
  }

  estimateAndRecord(
    provider: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    costFn: () => number
  ): number {
    const cost = costFn();
    if (cost === 0) {
      this.record({ provider, model, inputTokens, outputTokens, cost: 0 });
      return 0;
    }
    if (this.canSpend(cost)) {
      this.record({ provider, model, inputTokens, outputTokens, cost });
      const remaining = this.getRemaining();
      if (remaining < 1.0 && !this.warned) {
        this.warned = true;
      }
      return cost;
    }
    return -1;
  }
}
