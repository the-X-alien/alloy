import type { ToolSchema } from "../types.js";

export interface PluginHooks {
  event?: (event: string, data: unknown) => void | Promise<void>;
  config?: (config: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  tool?: PluginToolHook;
  provider?: PluginProviderHook;
  "chat.message"?: (msg: { role: string; content: string }) => { role: string; content: string } | Promise<{ role: string; content: string }>;
  "chat.params"?: (params: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>;
  "tool.execute.before"?: (toolName: string, args: unknown) => { abort: boolean; result?: string } | Promise<{ abort: boolean; result?: string }>;
  "tool.execute.after"?: (toolName: string, args: unknown, result: string) => string | Promise<string>;
  "session.compact"?: (messages: unknown[]) => unknown[] | Promise<unknown[]>;
}

export type PluginToolHook = (toolName: string, args: Record<string, unknown>) => Promise<string | null>;
export type PluginProviderHook = (provider: string, model: string) => Promise<{ provider: string; model: string } | null>;

export interface PluginModule {
  name: string;
  version?: string;
  description?: string;
  hooks: PluginHooks | ((client: PluginClient) => PluginHooks);
}

export interface PluginClient {
  notify(msg: string): void;
  getConfig(key: string): unknown;
}

export type PluginSource = "npm" | "local" | "mcp";

export interface PluginMeta {
  name: string;
  version?: string;
  source: PluginSource;
  path?: string;
  enabled: boolean;
  loaded: boolean;
}

export interface PluginTool extends ToolSchema {
  pluginName: string;
}
