import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";
import type { ChatMessage } from "../../providers/interface.js";

interface ChatViewProps {
  messages: ChatMessage[];
  streaming: boolean;
  streamContent: string;
}

export function ChatView({ messages, streaming, streamContent }: ChatViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} minHeight={0} paddingX={1}>
      {messages.length === 0 && !streaming && (
        <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
          <Text color={COLORS.textMuted}>No messages yet</Text>
        </Box>
      )}
      {messages.map((msg, i) => (
        <MessageBubble key={i} msg={msg} />
      ))}
      {streaming && streamContent && (
        <Box flexDirection="column" marginBottom={1}>
          <Box paddingX={1}>
            <Text bold color={COLORS.primary}>Alloy</Text>
            <Text color={COLORS.textMuted}> generating</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={COLORS.text}>{streamContent}</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box flexDirection="column" paddingX={1} paddingY={0}
        {...(isUser ? { backgroundColor: COLORS.bgElement } : {})}>
        <Box>
          <Text bold color={isUser ? COLORS.text : COLORS.primary}>
            {isUser ? "You" : "Alloy"}
          </Text>
          {msg.model && <Text color={COLORS.textMuted}> {msg.model}</Text>}
          {msg.cost != null && msg.cost > 0 && (
            <Text color={COLORS.textDim}>{` [$${msg.cost.toFixed(6)}]`}</Text>
          )}
        </Box>
        <Box marginLeft={1}>
          <Text color={COLORS.text}>{msg.content || " "}</Text>
        </Box>
      </Box>
    </Box>
  );
}
