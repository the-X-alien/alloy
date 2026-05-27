import type { CommandHandler } from "../../commands/registry.js";

export const planCommand: CommandHandler = async (ctx) => {
  if (!ctx.args[0]) {
    return {
      type: "message",
      content: [
        "Plan mode commands:",
        "  /plan <goal>     Produce a plan artifact for a goal",
        "  /build           Execute the current plan",
        "  /plan-view       View the current plan artifact",
        "",
        "Example: /plan Add user authentication with JWT",
      ].join("\n"),
    };
  }

  return {
    type: "message",
    content: `Planning: ${ctx.args.join(" ")}\nUse the TUI plan mode to execute this plan.`,
  };
};
