import type { CommandHandler } from "../../commands/registry.js";

export const memoryCommand: CommandHandler = async (ctx) => {
  const sub = ctx.args[0];

  if (!sub) {
    return {
      type: "message",
      content: [
        "Memory commands:",
        "  /memory search <query>   Search memories",
        "  /memory stats            Show memory stats",
        "  /forget <id>             Delete a memory entry",
        "",
        "Press Ctrl+M to browse memory in the dialog.",
      ].join("\n"),
    };
  }

  if (sub === "stats") {
    return {
      type: "message",
      content: "Memory stats: stored locally in ~/.alloy/memory/",
    };
  }

  if (sub === "search") {
    const query = ctx.args.slice(1).join(" ");
    return {
      type: "message",
      content: query ? `Searching memory for: ${query}\nUse the Memory Browser dialog (Ctrl+M) for interactive search.` : "Usage: /memory search <query>",
    };
  }

  return { type: "error", content: `Unknown memory subcommand: ${sub}` };
};
