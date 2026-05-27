import { ToolRegistry } from "./tool-registry.js";
import type { PluginRuntime } from "../plugin/runtime.js";
import type { MemoryManager } from "../memory/manager.js";
import type { ToolCall } from "../types.js";

export class ToolExecutor {
  constructor(
    private toolRegistry: ToolRegistry,
    private pluginRuntime?: PluginRuntime,
    private memoryManager?: MemoryManager,
  ) { }

  async execute(toolCall: ToolCall): Promise<string> {
    const { name, arguments: args } = toolCall;

    const result = await this.toolRegistry.execute(name, args);
    if (result) return result;

    if (this.memoryManager) {
      const memoryResult = this.memoryManager.handleToolCall(name, args);
      if (memoryResult) return memoryResult;
    }

    return `Error: Unknown tool "${name}"`;
  }

  getToolSchemas() {
    const schemas = this.toolRegistry.getSchemas();

    if (this.memoryManager) {
      schemas.push(...this.memoryManager.getToolSchemas());
    }

    return schemas;
  }
}
