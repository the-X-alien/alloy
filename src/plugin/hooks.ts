import type { PluginModule, PluginHooks, PluginClient } from "./types.js";

export class HookManager {
  private hooks: { pluginName: string; hooks: PluginHooks }[] = [];

  register(pluginName: string, hooks: PluginHooks): void {
    this.hooks.push({ pluginName, hooks });
  }

  unregister(pluginName: string): void {
    this.hooks = this.hooks.filter(h => h.pluginName !== pluginName);
  }

  async fire<T>(hookName: keyof PluginHooks, arg: T): Promise<T> {
    let current = arg as any;

    for (const { pluginName, hooks } of this.hooks) {
      const handler = hooks[hookName];
      if (!handler) continue;

      try {
        if (hookName === "chat.message") {
          current = await (handler as Function)(current);
        } else if (hookName === "chat.params") {
          current = await (handler as Function)(current);
        } else if (hookName === "tool.execute.before") {
          const result = await (handler as Function)((current as any).toolName, (current as any).args);
          if (result?.abort) return result;
        } else if (hookName === "tool.execute.after") {
          current = await (handler as Function)((current as any).toolName, (current as any).args, current);
        } else if (hookName === "session.compact") {
          current = await (handler as Function)(current);
        } else if (hookName === "event") {
          await (handler as Function)((current as any).event, (current as any).data);
        } else if (hookName === "config") {
          current = await (handler as Function)(current);
        } else if (hookName === "tool") {
          const result = await (handler as Function)((current as any).toolName, (current as any).args);
          if (result) return result;
        }
      } catch {
        continue;
      }
    }

    return current as T;
  }

  async fireEvent(event: string, data: unknown): Promise<void> {
    for (const { hooks } of this.hooks) {
      if (hooks.event) {
        try { await hooks.event(event, data); } catch { }
      }
    }
  }

  clear(): void {
    this.hooks = [];
  }
}
