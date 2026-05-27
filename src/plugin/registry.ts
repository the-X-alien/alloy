import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import type { PluginMeta, PluginModule, PluginSource } from "./types.js";

const PLUGINS_DIR = path.join(os.homedir(), ".alloy", "plugins");

export class PluginRegistry {
  private plugins = new Map<string, PluginMeta>();

  discover(): PluginMeta[] {
    if (!fs.existsSync(PLUGINS_DIR)) return [];

    const found: PluginMeta[] = [];
    const entries = fs.readdirSync(PLUGINS_DIR, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const pluginDir = path.join(PLUGINS_DIR, entry.name);
      const pkgJson = path.join(pluginDir, "package.json");
      const pluginJs = path.join(pluginDir, "index.js");

      if (fs.existsSync(pkgJson)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgJson, "utf-8"));
          const meta: PluginMeta = {
            name: pkg.name ?? entry.name,
            version: pkg.version,
            source: "local",
            path: pluginDir,
            enabled: true,
            loaded: false,
          };
          this.plugins.set(meta.name, meta);
          found.push(meta);
        } catch { }
      } else if (fs.existsSync(pluginJs)) {
        const meta: PluginMeta = {
          name: entry.name,
          source: "local",
          path: pluginDir,
          enabled: true,
          loaded: false,
        };
        this.plugins.set(meta.name, meta);
        found.push(meta);
      }
    }

    return found;
  }

  register(meta: PluginMeta): void {
    this.plugins.set(meta.name, meta);
  }

  unregister(name: string): void {
    this.plugins.delete(name);
  }

  get(name: string): PluginMeta | undefined {
    return this.plugins.get(name);
  }

  getAll(): PluginMeta[] {
    return Array.from(this.plugins.values());
  }

  getEnabled(): PluginMeta[] {
    return this.getAll().filter(p => p.enabled);
  }
}
