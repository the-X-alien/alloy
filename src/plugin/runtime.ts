import { PluginRegistry } from "./registry.js";
import { PluginLoader } from "./loader.js";
import { HookManager } from "./hooks.js";
import { MCPAdapter } from "./mcp-adapter.js";
import type { PluginMeta, PluginModule, PluginHooks, PluginClient } from "./types.js";

export class PluginRuntime {
  private registry = new PluginRegistry();
  private loader = new PluginLoader();
  private hooks = new HookManager();
  private mcpAdapter = new MCPAdapter();
  private client: PluginClient;

  constructor(client: PluginClient) {
    this.client = client;
  }

  get hookManager(): HookManager { return this.hooks; }

  async init(): Promise<void> {
    const discovered = this.registry.discover();
    for (const meta of discovered) {
      await this.activate(meta);
    }

    await this.mcpAdapter.init(this.hooks);
  }

  async activate(meta: PluginMeta): Promise<boolean> {
    const mod = await this.loader.load(meta);
    if (!mod) return false;

    const pluginHooks = typeof mod.hooks === "function" ? mod.hooks(this.client) : mod.hooks;
    this.hooks.register(mod.name, pluginHooks);

    meta.loaded = true;
    return true;
  }

  deactivate(name: string): void {
    this.hooks.unregister(name);
    const meta = this.registry.get(name);
    if (meta) meta.loaded = false;
  }

  getPlugins(): PluginMeta[] {
    return this.registry.getAll();
  }

  getActivePlugins(): PluginMeta[] {
    return this.registry.getEnabled().filter(p => p.loaded);
  }

  addPluginTool(name: string, tool: { name: string; description: string; inputSchema: Record<string, unknown> }): void {
    this.mcpAdapter.addTool(name, tool);
  }
}
