import type { CommandContext } from "../commands/registry.js";
import type { CommandResult } from "../commands/registry.js";

export type { CommandContext, CommandResult };
export type CommandHandler = (ctx: CommandContext) => CommandResult | Promise<CommandResult>;
