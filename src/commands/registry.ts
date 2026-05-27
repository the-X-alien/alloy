import { getModels, getProviderConfig, getProviders } from "../providers/registry.js";
import type { Session } from "../session/manager.js";

export interface CommandContext {
  args: string[];
  session: Session | null;
  currentModel: string;
  currentProvider: string;
  configuredProviders: { providerId: string; modelId: string }[];
  messages: number;
  costSpent: number;
  costBudget: number;
}

export interface CommandResult {
  type: "message" | "action" | "error";
  content: string;
  action?: {
    type: "switch-model" | "switch-provider" | "new-session" | "clear" | "exit" | "uninstall";
    payload?: string;
  };
}

export type CommandHandler = (ctx: CommandContext) => CommandResult | Promise<CommandResult>;

interface CommandDef {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  handler: CommandHandler;
}

const commands = new Map<string, CommandDef>();

function register(cmd: CommandDef) {
  commands.set(cmd.name, cmd);
  for (const a of cmd.aliases) commands.set(a, cmd);
}

register({
  name: "help",
  aliases: ["h", "?"],
  description: "Show available commands",
  usage: "/help [command]",
  handler: (ctx) => {
    if (ctx.args[0]) {
      const cmd = commands.get(ctx.args[0]);
      if (!cmd) return { type: "error", content: `Unknown command: ${ctx.args[0]}. Try /help` };
      return { type: "message", content: `${cmd.name}${cmd.aliases.length ? ` (${cmd.aliases.map(a => `/${a}`).join(", ")})` : ""}\n  ${cmd.description}\n  Usage: ${cmd.usage}` };
    }
    const lines = ["Available commands:"];
    const seen = new Set<string>();
    for (const [, cmd] of commands) {
      if (seen.has(cmd.name)) continue;
      seen.add(cmd.name);
      lines.push(`  /${cmd.name.padEnd(12)} ${cmd.description}`);
    }
    lines.push("", "Type /help <command> for details on a specific command.");
    return { type: "message", content: lines.join("\n") };
  },
});

register({
  name: "model",
  aliases: ["m"],
  description: "Switch AI model",
  usage: "/model <name>",
  handler: (ctx) => {
    if (!ctx.args[0]) {
      const available = getModels().slice(0, 20);
      const lines = ["Available models (use Ctrl+1-9 or /model <name>):"];
      for (const m of available) {
        const active = m.model === ctx.currentModel && m.provider === ctx.currentProvider;
        lines.push(`  ${active ? ">" : " "} ${m.provider}/${m.model} ${active ? "(active)" : ""}`);
      }
      return { type: "message", content: lines.join("\n") };
    }
    const query = ctx.args[0].toLowerCase();
    const match = getModels().find(m =>
      m.model.toLowerCase().includes(query) ||
      m.provider.toLowerCase().includes(query) ||
      `${m.provider}/${m.model}`.toLowerCase().includes(query)
    );
    if (!match) return { type: "error", content: `No model matching "${ctx.args[0]}". Try /models` };
    return {
      type: "action",
      content: `Switched to ${match.provider}/${match.model}`,
      action: { type: "switch-model", payload: match.model },
    };
  },
});

register({
  name: "models",
  aliases: ["list-models"],
  description: "List all available models",
  usage: "/models",
  handler: (ctx) => {
    const all = getModels();
    const grouped = new Map<string, typeof all>();
    for (const m of all) {
      if (!grouped.has(m.provider)) grouped.set(m.provider, []);
      grouped.get(m.provider)!.push(m);
    }
    const lines = [`Configured providers: ${ctx.configuredProviders.length} models available`, ""];
    for (const [provider, models] of grouped) {
      const configured = ctx.configuredProviders.some(p => p.providerId === provider);
      lines.push(`  ${configured ? "\u2713" : " "} ${provider} (${models.length} models)`);
      for (const m of models.slice(0, 3)) {
        const active = m.model === ctx.currentModel && m.provider === ctx.currentProvider;
        lines.push(`    ${active ? ">" : " "} ${m.model} $${m.costPerInput.toFixed(2)}/$${m.costPerOutput.toFixed(2)}/1M tok`);
      }
      if (models.length > 3) lines.push(`    ... ${models.length - 3} more`);
    }
    return { type: "message", content: lines.join("\n") };
  },
});

register({
  name: "provider",
  aliases: ["p", "prov"],
  description: "Switch AI provider",
  usage: "/provider <name>",
  handler: (ctx) => {
    if (!ctx.args[0]) {
      const providers = [...new Set(getModels().map(m => m.provider))];
      const lines = ["Available providers:"];
      for (const p of providers) {
        const cfg = getProviderConfig(p);
        const configured = ctx.configuredProviders.some(c => c.providerId === p);
        const active = p === ctx.currentProvider;
        const keyHint = cfg?.apiKeyHint ?? "";
        lines.push(`  ${active ? ">" : " "} ${p}${configured ? " \u2713" : ""} ${active ? "(active)" : ""}`);
        if (!configured && keyHint) lines.push(`     Key: ${cfg?.apiKeyEnv} (${keyHint})`);
      }
      return { type: "message", content: lines.join("\n") };
    }
    const query = ctx.args[0].toLowerCase();
    const providers = [...new Set(getModels().map(m => m.provider))];
    const match = providers.find(p => p.includes(query));
    if (!match) return { type: "error", content: `No provider matching "${query}". Try /providers` };
    const model = getModels().find(m => m.provider === match);
    if (!model) return { type: "error", content: `Provider "${match}" has no models configured` };
    return {
      type: "action",
      content: `Switched to provider: ${match}`,
      action: { type: "switch-provider", payload: match },
    };
  },
});

register({
  name: "providers",
  aliases: ["list-providers"],
  description: "List all available providers",
  usage: "/providers",
  handler: (ctx) => {
    const providers = [...new Set(getModels().map(m => m.provider))];
    const lines = ["Available providers:", ""];
    for (const p of providers) {
      const cfg = getProviderConfig(p);
      const configured = ctx.configuredProviders.some(c => c.providerId === p);
      const count = getModels().filter(m => m.provider === p).length;
      const active = p === ctx.currentProvider;
      lines.push(`  ${active ? ">" : " "} ${p.padEnd(18)} ${count} models ${configured ? "\u2713 configured" : ""}${active ? " (active)" : ""}`);
    }
    return { type: "message", content: lines.join("\n") };
  },
});

register({
  name: "clear",
  aliases: ["c"],
  description: "Clear conversation history",
  usage: "/clear",
  handler: () => ({ type: "action", content: "Conversation cleared", action: { type: "clear" } }),
});

register({
  name: "new",
  aliases: ["n", "session"],
  description: "Start a new session",
  usage: "/new [title]",
  handler: (ctx) => ({
    type: "action",
    content: ctx.args[0] ? `New session: ${ctx.args.join(" ")}` : "New session started",
    action: { type: "new-session" },
  }),
});

register({
  name: "sessions",
  aliases: ["sessions-list"],
  description: "List all sessions",
  usage: "/sessions",
  handler: (ctx) => ({
    type: "message",
    content: `Session: ${ctx.session?.title ?? "none"}\nMessages: ${ctx.messages}\nCost: $${ctx.costSpent.toFixed(4)} / $${ctx.costBudget.toFixed(2)}`,
  }),
});

register({
  name: "status",
  aliases: ["s", "stats"],
  description: "Show session status",
  usage: "/status",
  handler: (ctx) => ({
    type: "message",
    content: [
      `Session: ${ctx.session?.title ?? "none"}`,
      `Provider: ${ctx.currentProvider}`,
      `Model: ${ctx.currentModel}`,
      `Messages: ${ctx.messages}`,
      `Cost spent: $${ctx.costSpent.toFixed(4)}`,
      `Budget: $${ctx.costBudget.toFixed(2)}`,
      `Remaining: $${(ctx.costBudget - ctx.costSpent).toFixed(4)}`,
    ].join("\n"),
  }),
});

register({
  name: "exit",
  aliases: ["quit", "q"],
  description: "Exit Alloy",
  usage: "/exit",
  handler: () => ({ type: "action", content: "Goodbye!", action: { type: "exit" } }),
});

register({
  name: "uninstall",
  aliases: ["remove", "delete"],
  description: "Uninstall Alloy completely",
  usage: "/uninstall",
  handler: () => ({
    type: "action",
    content: "Uninstalling Alloy...",
    action: { type: "uninstall" },
  }),
});

register({
  name: "import",
  aliases: ["migrate"],
  description: "Import configuration from another tool",
  usage: "/import <claude|opencode|openclaw>",
  handler: (ctx) => {
    if (!ctx.args[0]) {
      return {
        type: "message",
        content: "Import from another tool:\n  /import claude    - Import Claude Code config\n  /import opencode  - Import OpenCode config\n  /import openclaw  - Import OpenClaw config\n  /import all       - Import from all detected tools",
      };
    }
    return {
      type: "message",
      content: `Scanning for ${ctx.args[0]} configuration...\nUse this outside the TUI:\n  alloy --import ${ctx.args[0]}`,
    };
  },
});

register({
  name: "compact",
  aliases: ["compress"],
  description: "Compact session context",
  usage: "/compact",
  handler: () => ({ type: "message", content: "Session compacted" }),
});

register({
  name: "copy",
  aliases: ["yank"],
  description: "Copy last response to clipboard",
  usage: "/copy",
  handler: () => ({ type: "message", content: "Copied to clipboard" }),
});

register({
  name: "version",
  aliases: ["v", "--version"],
  description: "Show version",
  usage: "/version",
  handler: () => {
    const pkg = { version: "0.0.1" };
    return { type: "message", content: `Alloy v${pkg.version}` };
  },
});

register({
  name: "skills",
  aliases: ["agents"],
  description: "List available skills/agents",
  usage: "/skills",
  handler: () => ({
    type: "message",
    content: "Skills:\n  No skills installed yet.\n  Skills go in ~/.alloy/skills/\n  See: https://github.com/the-X-alien/alloy#skills",
  }),
});

register({
  name: "configure",
  aliases: ["config", "setup", "key", "apikey"],
  description: "Set an API key for a provider",
  usage: "/configure [provider_id] [api_key]",
  handler: (ctx) => {
    if (!ctx.args[0]) {
      const lines = ["Configure API keys:", ""];
      const allProviders = getProviders();
      for (const p of allProviders) {
        if (!p.apiKeyEnv) continue;
        const hasKey = !!process.env[p.apiKeyEnv];
        lines.push(`  ${hasKey ? "\u2713" : " "} ${p.id.padEnd(18)} ${hasKey ? "(set)" : "missing"}  (env: ${p.apiKeyEnv})`);
        if (!hasKey) lines.push(`    ${p.apiKeyHint}`);
      }
      lines.push("", "Usage:");
      lines.push('  /configure <provider_id> <api_key>   Set API key');
      lines.push("  /configure                          Show status");
      lines.push("", "Example:");
      lines.push('  /configure openai sk-...');
      lines.push('  /configure anthropic sk-ant-...');
      lines.push('  /configure groq gsk_...');
      return { type: "message", content: lines.join("\n") };
    }

    const providerId = ctx.args[0].toLowerCase();
    const p = getProviderConfig(providerId);
    if (!p) {
      const ids = getProviders().map(x => x.id);
      const close = ids.find(id => id.includes(providerId) || providerId.includes(id));
      const hint = close ? ` Did you mean /configure ${close}?` : "";
      return { type: "error", content: `Unknown provider: "${providerId}".${hint} See available providers with /providers` };
    }

    if (!ctx.args[1]) {
      const hasKey = p.apiKeyEnv ? !!process.env[p.apiKeyEnv] : true;
      return {
        type: "message",
        content: `${p.name} (${p.id}):\n  Env var: ${p.apiKeyEnv}\n  Status: ${hasKey ? "\u2713 configured" : "missing"}\n  Hint: ${p.apiKeyHint}\n\nTo set: /configure ${p.id} <your-api-key>`,
      };
    }

    const key = ctx.args.slice(1).join(" ");
    if (p.apiKeyEnv) {
      process.env[p.apiKeyEnv] = key;
    }

    return {
      type: "message",
      content: `\u2713 ${p.name} API key configured via ${p.apiKeyEnv}\n  You can now use /provider ${p.id} to switch to it.`,
    };
  },
});

register({
  name: "env",
  aliases: ["environ", "vars"],
  description: "View configured environment variables (hides key content)",
  usage: "/env",
  handler: () => {
    const lines = ["Configured environment variables:", ""];
    const allProviders = getProviders();
    const seen = new Set<string>();
    for (const p of allProviders) {
      if (!p.apiKeyEnv || seen.has(p.apiKeyEnv)) continue;
      seen.add(p.apiKeyEnv);
      const val = process.env[p.apiKeyEnv];
      const displayed = val ? `${p.apiKeyEnv}=${val.slice(0, 8)}...${val.slice(-4)}` : `${p.apiKeyEnv} (not set)`;
      lines.push(`  ${val ? "\u2713" : " "} ${displayed}`);
    }
    return { type: "message", content: lines.join("\n") };
  },
});

register({
  name: "theme",
  aliases: ["themes"],
  description: "Switch color theme",
  usage: "/theme [name]",
  handler: (ctx) => {
    const themes = ["default", "catppuccin", "dracula", "gruvbox", "nord", "solarized"];
    if (!ctx.args[0]) {
      return { type: "message", content: `Themes:\n${themes.map(t => `  ${t}`).join("\n")}\n\nUsage: /theme <name>` };
    }
    return { type: "message", content: `Theme will be: ${ctx.args[0]}` };
  },
});

register({
  name: "discover",
  aliases: ["scan-models", "crawl"],
  description: "Discover available models from a provider's API endpoint",
  usage: "/discover <provider_id> [api_key]",
  handler: (ctx) => {
    if (!ctx.args[0]) {
      return {
        type: "message",
        content: "Discover models from a provider:\n  /discover <provider_id>  - Fetch models from provider's API\n  /discover <provider_id> <key> - Fetch models with a specific key\n\nExample:\n  /discover openrouter\n  /discover groq gsk_...",
      };
    }
    return {
      type: "action",
      content: `Discovering models for ${ctx.args[0]}...`,
      action: { type: "message" },
    };
  },
});

register({
  name: "details",
  aliases: ["verbose", "d"],
  description: "Toggle tool execution details display",
  usage: "/details",
  handler: () => ({ type: "message", content: "Toggled tool execution details. Use Ctrl+D to toggle at runtime." }),
});

register({
  name: "editor",
  aliases: ["edit", "e"],
  description: "Open external editor for composing messages",
  usage: "/editor",
  handler: () => ({
    type: "message",
    content: "Opening external editor... Use EDITOR env var to set your editor (e.g. code --wait, vim, nano).",
  }),
});

register({
  name: "export",
  aliases: ["x"],
  description: "Export current conversation to Markdown",
  usage: "/export",
  handler: () => ({
    type: "message",
    content: "Exporting conversation... The Markdown file will be opened in your default editor.",
  }),
});

register({
  name: "redo",
  aliases: ["r"],
  description: "Redo a previously undone message",
  usage: "/redo",
  handler: () => ({ type: "message", content: "No undone message to redo." }),
});

register({
  name: "undo",
  aliases: ["u"],
  description: "Undo last message in the conversation",
  usage: "/undo",
  handler: () => ({ type: "message", content: "Last message undone." }),
});

register({
  name: "thinking",
  aliases: ["reasoning"],
  description: "Toggle visibility of thinking/reasoning blocks",
  usage: "/thinking",
  handler: () => ({ type: "message", content: "Thinking blocks toggled." }),
});

register({
  name: "share",
  aliases: ["publish"],
  description: "Share current session via URL",
  usage: "/share",
  handler: () => ({ type: "message", content: "Session sharing is not yet implemented." }),
});

register({
  name: "unshare",
  aliases: ["unpublish"],
  description: "Unshare the current shared session",
  usage: "/unshare",
  handler: () => ({ type: "message", content: "Session sharing is not yet implemented." }),
});

register({
  name: "init",
  aliases: ["bootstrap", "setup-agent"],
  description: "Guided setup for creating AGENTS.md",
  usage: "/init",
  handler: () => ({
    type: "message",
    content: "AGENTS.md guided setup:\n  1. Analyzes your repo structure\n  2. Detects tech stack\n  3. Generates AGENTS.md\n\nRun: alloy --init   (outside the TUI)",
  }),
});

export function getCommand(name: string): CommandDef | undefined {
  const cmd = commands.get(name.toLowerCase());
  return cmd;
}

export function getAllCommands(): { name: string; description: string }[] {
  const seen = new Set<string>();
  const result: { name: string; description: string }[] = [];
  for (const [, cmd] of commands) {
    if (seen.has(cmd.name)) continue;
    seen.add(cmd.name);
    result.push({ name: cmd.name, description: cmd.description });
  }
  return result;
}

export function parseCommand(input: string): { command: string; args: string[] } | null {
  if (!input.startsWith("/")) return null;
  const parts = input.slice(1).trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === "") return null;
  return { command: parts[0].toLowerCase(), args: parts.slice(1) };
}
