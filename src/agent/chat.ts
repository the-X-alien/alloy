import { AgentMode } from "../types.js";
import type { AgentConfig, AgentResult } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";
import { runConversation, type LoopConfig } from "./conversation-loop.js";

export class ChatAgent {
  readonly mode = AgentMode.Chat;

  async execute(
    userMessage: string,
    messages: ChatMessage[],
    config: AgentConfig,
    loopConfig: LoopConfig,
    onToken: (token: string) => void,
  ): Promise<AgentResult> {
    return runConversation(userMessage, messages, config, loopConfig, onToken);
  }
}
