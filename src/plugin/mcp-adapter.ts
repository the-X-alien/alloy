import type { HookManager } from "./hooks.js";

interface MCPToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPAdapter {
  private tools: Map<string, MCPToolDef> = new Map();
  private connections: Map<string, any> = new Map();

  async init(hooks: HookManager): Promise<void> {
  }

  addTool(pluginName: string, tool: MCPToolDef): void {
    this.tools.set(tool.name, tool);
  }

  getTools(): MCPToolDef[] {
    return Array.from(this.tools.values());
  }

  async connect(serverName: string, command: string, args: string[]): Promise<boolean> {
    try {
      const { spawn } = await import("node:child_process");
      const proc = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
      this.connections.set(serverName, proc);

      proc.on("exit", () => {
        this.connections.delete(serverName);
      });

      return true;
    } catch {
      return false;
    }
  }

  disconnect(serverName: string): void {
    const proc = this.connections.get(serverName);
    if (proc) {
      proc.kill();
      this.connections.delete(serverName);
    }
  }

  disconnectAll(): void {
    for (const [name] of this.connections) {
      this.disconnect(name);
    }
  }
}
