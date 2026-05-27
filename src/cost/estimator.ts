import { getModelCost } from "../providers/registry.js";

export class CostEstimator {
  estimate(provider: string, model: string, inputTokens: number, outputTokens: number): number {
    const costs = getModelCost(provider, model);
    if (!costs) return 0;
    return (inputTokens / 1_000_000 * costs.input) + (outputTokens / 1_000_000 * costs.output);
  }

  estimateInput(provider: string, model: string, inputTokens: number): number {
    const costs = getModelCost(provider, model);
    if (!costs) return 0;
    return (inputTokens / 1_000_000 * costs.input);
  }

  estimateOutput(provider: string, model: string, outputTokens: number): number {
    const costs = getModelCost(provider, model);
    if (!costs) return 0;
    return (outputTokens / 1_000_000 * costs.output);
  }

  formatCost(cost: number): string {
    if (cost < 0.0001) return "<$0.0001";
    return `$${cost.toFixed(4)}`;
  }
}
