import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";
import type { ChatMessage } from "../../providers/interface.js";

interface MessageProps {
  message: ChatMessage;
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        flexDirection="column"
        paddingX={1}
        paddingY={0}
        {...(isUser ? { backgroundColor: COLORS.bgElement } : {})}
      >
        <Box>
          <Text bold color={isUser ? COLORS.text : COLORS.primary}>
            {isUser ? "You" : "Alloy"}
          </Text>
          {message.model && (
            <Text color={COLORS.textMuted}> {message.model}</Text>
          )}
          {message.cost != null && message.cost > 0 && (
            <Text color={COLORS.textDim}>{` [$${message.cost.toFixed(6)}]`}</Text>
          )}
        </Box>
        <Box marginLeft={1}>
          <Text color={COLORS.text}>{message.content || " "}</Text>
        </Box>
      </Box>
    </Box>
  );
}
