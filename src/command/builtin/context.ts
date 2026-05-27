import type { CommandHandler } from "../../commands/registry.js";

export const contextCommand: CommandHandler = async (ctx) => {
  const sub = ctx.args[0];

  if (!sub) {
    return {
      type: "message",
      content: [
        "Context commands:",
        "  /context list             List saved context banks",
        "  /context save <name>      Save context bank",
        "  /context delete <name>    Delete context bank",
        "",
        "Context banks auto-inject when your prompt matches their trigger pattern.",
      ].join("\n"),
    };
  }

  if (sub === "list") {
    return { type: "message", content: "Use the Context Banks dialog to view entries." };
  }

  if (sub === "save") {
    return { type: "message", content: "Use the Context Banks dialog to create entries." };
  }

  return { type: "error", content: `Unknown context subcommand: ${sub}` };
};
