export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue };

export type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type Brand<T, B extends string> = T & { __brand: B };

export type AsyncReturnType<T extends (...args: any[]) => any> = T extends (...args: any[]) => Promise<infer R> ? R : never;

export type Awaitable<T> = T | Promise<T>;

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export enum AgentMode {
  Chat = "chat",
  Plan = "plan",
  Build = "build",
}

export enum MessageRole {
  User = "user",
  Assistant = "assistant",
  System = "system",
  Tool = "tool",
}
