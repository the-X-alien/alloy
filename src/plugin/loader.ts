import * as path from "node:path";
import type { PluginMeta, PluginModule, PluginClient } from "./types.js";

export class PluginLoader {
  async load(meta: PluginMeta): Promise<PluginModule | null> {
    try {
      if (meta.source === "npm" && meta.path) {
        const mod = await this.loadFromPath(meta.path);
        return mod;
      }

      if (meta.source === "local" && meta.path) {
        const mod = await this.loadFromPath(meta.path);
        return mod;
      }

      if (meta.source === "npm" && meta.name) {
        const mod = await this.loadFromNpm(meta.name);
        return mod;
      }

      return null;
    } catch {
      return null;
    }
  }

  private async loadFromPath(pluginPath: string): Promise<PluginModule | null> {
    try {
      const mod = await import(pluginPath);
      if (this.isValidPlugin(mod)) return mod;
      if (mod.default && this.isValidPlugin(mod.default)) return mod.default;
      return null;
    } catch {
      return null;
    }
  }

  private async loadFromNpm(name: string): Promise<PluginModule | null> {
    try {
      const mod = await import(name);
      if (this.isValidPlugin(mod)) return mod;
      if (mod.default && this.isValidPlugin(mod.default)) return mod.default;
      return null;
    } catch {
      return null;
    }
  }

  private isValidPlugin(mod: any): mod is PluginModule {
    return mod && typeof mod === "object" && typeof mod.name === "string" && mod.hooks;
  }
}
