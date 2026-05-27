import { ToolRegistry, type ToolHandler } from "../tool-registry.js";
import { createWebSearchTool } from "./web-search.js";
import { createWebFetchTool } from "./web-fetch.js";
import { createDiscoverModelsTool, createDiscoverModelsCommand } from "./discover-models.js";
import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

export function registerDefaultTools(registry: ToolRegistry): void {
  registry.register(createReadFileTool());
  registry.register(createWriteFileTool());
  registry.register(createListFilesTool());
  registry.register(createBashTool());
  registry.register(createGlobTool());
  registry.register(createGrepTool());
  registry.register(createWebSearchTool());
  registry.register(createWebFetchTool());
  registry.register(createDiscoverModelsTool());
  registry.register(createDiscoverModelsCommand());
}

function createReadFileTool(): ToolHandler {
  return {
    schema: {
      name: "read",
      description: "Read the contents of a file",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to the file" },
        },
        required: ["filePath"],
      },
    },
    execute: async (args) => {
      const filePath = String(args.filePath);
      try {
        return fs.readFileSync(filePath, "utf-8");
      } catch (err: any) {
        return `Error reading file: ${err?.message}`;
      }
    },
  };
}

function createWriteFileTool(): ToolHandler {
  return {
    schema: {
      name: "write",
      description: "Write content to a file (overwrites existing)",
      inputSchema: {
        type: "object",
        properties: {
          filePath: { type: "string", description: "Absolute path to the file" },
          content: { type: "string", description: "Content to write" },
        },
        required: ["filePath", "content"],
      },
    },
    execute: async (args) => {
      const filePath = String(args.filePath);
      const content = String(args.content);
      try {
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, content, "utf-8");
        return `Written ${Buffer.byteLength(content, "utf-8")} bytes to ${filePath}`;
      } catch (err: any) {
        return `Error writing file: ${err?.message}`;
      }
    },
  };
}

function createListFilesTool(): ToolHandler {
  return {
    schema: {
      name: "list_files",
      description: "List files in a directory",
      inputSchema: {
        type: "object",
        properties: {
          path: { type: "string", description: "Directory path" },
        },
        required: ["path"],
      },
    },
    execute: async (args) => {
      const dirPath = String(args.path);
      try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        return entries.map(e => {
          const prefix = e.isDirectory() ? "📁" : "📄";
          return `${prefix} ${e.name}`;
        }).join("\n");
      } catch (err: any) {
        return `Error listing directory: ${err?.message}`;
      }
    },
  };
}

function createBashTool(): ToolHandler {
  return {
    schema: {
      name: "bash",
      description: "Execute a bash/shell command",
      inputSchema: {
        type: "object",
        properties: {
          command: { type: "string", description: "Command to execute" },
          timeout: { type: "number", description: "Timeout in ms (default 30000)" },
        },
        required: ["command"],
      },
    },
    execute: async (args) => {
      const command = String(args.command);
      const timeout = Number(args.timeout ?? 30000);
      try {
        const output = execSync(command, {
          encoding: "utf-8",
          timeout,
          maxBuffer: 10 * 1024 * 1024,
          shell: process.platform === "win32" ? "powershell" : true,
        });
        return output || "(command completed with no output)";
      } catch (err: any) {
        return `Error: ${err?.message ?? "Unknown"}`;
      }
    },
  };
}

function createGlobTool(): ToolHandler {
  return {
    schema: {
      name: "glob",
      description: "Find files matching a glob pattern",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Glob pattern (e.g. src/**/*.ts)" },
          path: { type: "string", description: "Root directory" },
        },
        required: ["pattern"],
      },
    },
    execute: async (args) => {
      const pattern = String(args.pattern);
      const root = args.path ? String(args.path) : process.cwd();
      try {
        const { globSync } = await import("glob");
        const files = globSync(pattern, { cwd: root, nodir: true });
        return files.length > 0 ? files.join("\n") : "No files found matching pattern";
      } catch (err: any) {
        return `Error: ${err?.message}`;
      }
    },
  };
}

function createGrepTool(): ToolHandler {
  return {
    schema: {
      name: "grep",
      description: "Search file contents for a pattern",
      inputSchema: {
        type: "object",
        properties: {
          pattern: { type: "string", description: "Search pattern (regex)" },
          path: { type: "string", description: "Directory to search" },
          include: { type: "string", description: "File pattern (e.g. *.ts)" },
        },
        required: ["pattern"],
      },
    },
    execute: async (args) => {
      const pattern = String(args.pattern);
      const searchPath = args.path ? String(args.path) : process.cwd();
      const include = args.include ? String(args.include) : "";
      try {
        const { execSync } = await import("node:child_process");
        const includeFlag = include ? `--include="${include}"` : "";
        const cmd = `rg -n "${pattern.replace(/"/g, '\\"')}" ${includeFlag} "${searchPath}" 2>nul | head -50`;
        const output = execSync(cmd, { encoding: "utf-8", timeout: 10000 });
        return output || "No matches found";
      } catch {
        return "No matches found or search failed";
      }
    },
  };
}
