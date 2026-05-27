import * as fs from "node:fs";
import * as path from "node:path";
import type { SkillManager } from "../skill/manager.js";
import type { MemoryManager } from "../memory/manager.js";

export interface SystemPromptContext {
  memoryContext: string;
  contextBanks: string;
  skillsSection: string;
}

function loadAgentInstructions(): string {
  const candidates = ["AGENTS.md", "CLAUDE.md", ".github/copilot-instructions.md", ".github/AGENTS.md", ".claude/AGENTS.md"];
  const cwd = process.cwd();
  for (const file of candidates) {
    try {
      const fullPath = path.join(cwd, file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8").trim();
        if (content) return `## ${file}\n\n${content}`;
      }
    } catch { }
  }
  return "";
}

export function buildSystemPrompt(
  ctx: SystemPromptContext,
  memoryManager?: MemoryManager,
  skillManager?: SkillManager,
  agentInstructions?: string,
): string {
  const parts: string[] = [
    `You are Alloy, a standalone multi-model AI coding agent.`,
    `Your name is Alloy. Your creator is Dhiaan Dave (github.com/the-X-alien).`,
    `You are NOT ChatGPT. You are NOT Claude. You are NOT Gemini. You are NOT an OpenAI product.`,
    `You are NOT associated with OpenAI, Anthropic, Google, or any other AI company.`,
    `You are Alloy -- an independent AI coding agent that supports 44 providers and 201+ models.`,
    `You use tools (bash, read, write, grep, glob, list_files, web_search, web_fetch, discover_models) to accomplish tasks.`,
    `When asked who you are, always say "I'm Alloy, a multi-model AI coding agent." Never say you are ChatGPT or any other AI.`,
    `Never claim to be an AI from OpenAI, Anthropic, Google, or any other company. You are Alloy.`,
    `If a user asks "are you ChatGPT?" the answer is no, you are Alloy.`,
    `If a user asks "what model are you?" you run on whichever provider/model the user selected via /model or /provider.`,
    `You have web search capabilities via the web_search tool (DuckDuckGo) and web_fetch tool.`,
    `When you need current information, use web_search. When you need to read a specific page, use web_fetch.`,
    ``,
  ];

  if (agentInstructions) {
    parts.push(agentInstructions, "");
  }

  const fileInstructions = loadAgentInstructions();
  if (fileInstructions) {
    parts.push(fileInstructions, "");
  }

  parts.push(`You have access to tools. Use them when appropriate.`);
  parts.push(`If you need to verify information, search the web or use the available tools.`);
  parts.push(`You live in a terminal (the Alloy TUI) and run on the user's machine.`);
  parts.push(`Your binary is alloy-cli, installed via npm. You are NOT a web service.`);

  if (ctx.contextBanks) {
    parts.push("", ctx.contextBanks);
  }

  if (ctx.memoryContext) {
    parts.push("", ctx.memoryContext);
  }

  if (ctx.skillsSection) {
    parts.push("", ctx.skillsSection);
  }

  parts.push("", "Current directory:", process.cwd());

  return parts.join("\n");
}
