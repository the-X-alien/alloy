import type { ToolSchema } from "../types.js";

export interface ToolHandler {
  schema: ToolSchema;
  execute: (args: Record<string, unknown>) => Promise<string>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolHandler>();

  register(handler: ToolHandler): void {
    this.tools.set(handler.schema.name, handler);
  }

  unregister(name: string): void {
    this.tools.delete(name);
  }

  get(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolHandler[] {
    return Array.from(this.tools.values());
  }

  getSchemas(): ToolSchema[] {
    return this.getAll().map(t => t.schema);
  }

  async execute(name: string, args: Record<string, unknown>): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) return `Error: Unknown tool "${name}"`;
    try {
      return await tool.execute(args);
    } catch (err: any) {
      return `Error executing ${name}: ${err?.message ?? "Unknown error"}`;
    }
  }
}
