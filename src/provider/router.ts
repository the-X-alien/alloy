import { getModels, getModelCost } from "../providers/registry.js";
import type { Provider } from "../providers/interface.js";

export type ComplexityTier = "cheap" | "default" | "expensive";

const SIMPLE_PATTERNS = [
  /^(?:hello|hi|hey|thanks|thank you|ok|okay|yes|no|bye|goodbye)\b/i,
  /^who are you/i,
  /^what can you do/i,
  /^help$/i,
  /^(?:what time|what date)/i,
  /^what'?s? up/i,
  /^(?:how are you|how'?s? it going)/i,
];

const COMPLEX_PATTERNS = [
  /\b(?:architecture|design pattern|refactor|migrate|rearchitect)\b/i,
  /\b(?:security|vulnerability|threat model|penetration test)\b/i,
  /\b(?:multi-step|plan|orchestrat|distribut|deploy|rollout)\b/i,
  /\b(?:performance\s*optim|benchmark|profiling|latency)\b/i,
  /\b(?:docker|kubernetes|terraform|infrastructure|ci\/cd)\b/i,
  /\b(?:database|schema|migration|query\s*optim|index)\b/i,
  /\b(?:api\s*design|rate\s*limit|auth|oauth|jwt|saml)\b/i,
  /\b(?:machine learning|neural|deep learning|llm|ai)\b/i,
  /\b(?:complex|difficult|hard|challenging|sophisticated)\b/i,
];

const BUDGET_PATTERNS = [
  /\b(?:cheap|inexpensive|simple|fast|quick|small|short)\b/i,
  /\b(?:budget|cost|limit|minimal|basic)\b/i,
];

function classifyComplexity(message: string): ComplexityTier {
  const trimmed = message.trim();
  if (trimmed.length === 0) return "cheap";

  for (const p of SIMPLE_PATTERNS) {
    if (p.test(trimmed)) return "cheap";
  }

  const budgetHits = BUDGET_PATTERNS.filter(p => p.test(trimmed)).length;
  if (budgetHits >= 2) return "cheap";

  if (trimmed.length < 30) return "cheap";

  const complexHits = COMPLEX_PATTERNS.filter(p => p.test(trimmed)).length;
  if (complexHits >= 2) return "expensive";

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 100) return "expensive";
  if (wordCount > 250) return "expensive";

  if (complexHits === 1 && wordCount > 30) return "default";

  return "default";
}

export interface RouterConfig {
  enabled: boolean;
  cheapModel: string;
  cheapProvider: string;
  defaultModel: string;
  defaultProvider: string;
  expensiveModel: string;
  expensiveProvider: string;
  classifyModel?: string;
  useLLMClassification?: boolean;
  llmProvider?: Provider;
}

export class ModelRouter {
  private config: RouterConfig;

  constructor(config: Partial<RouterConfig> = {}) {
    this.config = {
      enabled: true,
      cheapModel: config.cheapModel ?? "gpt-4.1-nano",
      cheapProvider: config.cheapProvider ?? "openai",
      defaultModel: config.defaultModel ?? "gpt-4o",
      defaultProvider: config.defaultProvider ?? "openai",
      expensiveModel: config.expensiveModel ?? "gpt-4o",
      expensiveProvider: config.expensiveProvider ?? "openai",
      useLLMClassification: config.useLLMClassification ?? false,
      llmProvider: config.llmProvider,
    };
  }

  route(message: string, budgetRemaining: number): string {
    if (!this.config.enabled) return this.config.defaultModel;

    const tier = classifyComplexity(message);

    if (budgetRemaining < 1.0 && tier !== "cheap") {
      return this.config.cheapModel;
    }

    switch (tier) {
      case "cheap":
        return this.config.cheapModel;
      case "expensive":
        return this.config.expensiveModel;
      default:
        return this.config.defaultModel;
    }
  }

  async routeWithLLM(
    message: string,
    budgetRemaining: number,
  ): Promise<string> {
    if (!this.config.enabled || !this.config.useLLMClassification || !this.config.llmProvider) {
      return this.route(message, budgetRemaining);
    }

    const keywordTier = classifyComplexity(message);
    if (keywordTier !== "default") {
      return this.route(message, budgetRemaining);
    }

    try {
      const classification = await this.classifyWithLLM(message);
      const tier = classification === "complex" ? "expensive" : "default";
      return this.routeForTier(tier, budgetRemaining);
    } catch {
      return this.route(message, budgetRemaining);
    }
  }

  private async classifyWithLLM(message: string): Promise<"simple" | "complex"> {
    const provider = this.config.llmProvider!;
    const classifyPrompt = `Classify this user request as "simple" or "complex".
Simple: factual answers, quick lookups, greetings, confirming info.
Complex: multi-step reasoning, code generation, architecture, planning, debugging.
Reply with exactly one word.

Request: ${message.slice(0, 500)}`;

    let response = "";
    for await (const chunk of provider.chat(
      [{ role: "user", content: classifyPrompt, timestamp: Date.now() }],
      { model: this.config.classifyModel ?? this.config.cheapModel },
    )) {
      response += chunk;
    }

    const trimmed = response.trim().toLowerCase();
    if (trimmed.startsWith("complex")) return "complex";
    return "simple";
  }

  private routeForTier(tier: ComplexityTier, budgetRemaining: number): string {
    if (budgetRemaining < 1.0 && tier !== "cheap") {
      return this.config.cheapModel;
    }

    switch (tier) {
      case "cheap":
        return this.config.cheapModel;
      case "expensive":
        return this.config.expensiveModel;
      default:
        return this.config.defaultModel;
    }
  }

  getProviderForModel(model: string): string {
    const all = getModels();
    const match = all.find(m => m.model === model);
    return match?.provider ?? this.config.defaultProvider;
  }
}
