import React from "react";
import { Text, Box } from "ink";
import { Messages } from "./messages.js";
import { PromptDisplay } from "./prompt.js";
import { COLORS } from "./theme.js";
import type { ChatMessage } from "../providers/interface.js";

interface SessionProps {
  messages: ChatMessage[];
  streaming: boolean;
  streamContent: string;
  input: string;
}

export function Session({ messages, streaming, streamContent, input }: SessionProps) {
  const rows: React.ReactNode[] = [];

  for (const msg of messages) {
    rows.push(
      <Box key={`msg-${msg.timestamp}`} flexDirection="column" marginY={0}>
        <Box>
          <Text bold color={msg.role === "user" ? COLORS.textBright : COLORS.accent}>
            {msg.role === "user" ? "\u25C9 You" : "\u25C9 Alloy"}
          </Text>
          {msg.model && (
            <Text color={COLORS.textDim}> {msg.model}</Text>
          )}
          {msg.cost != null && msg.cost > 0 && (
            <Text color={COLORS.textDim}>{` [$${msg.cost.toFixed(6)}]`}</Text>
          )}
        </Box>
        <Box marginLeft={1} marginTop={0}>
          <Text color={COLORS.text}>{msg.content || " "}</Text>
        </Box>
        <Box height={1} />
      </Box>
    );
  }

  if (streaming) {
    rows.push(
      <Box key="stream" flexDirection="column" marginY={0}>
        <Box>
          <Text bold color={COLORS.accent}>{"\u25CF Alloy generating"}</Text>
        </Box>
        <Box marginLeft={1} marginTop={0}>
          <Text color={COLORS.text}>{streamContent || " "}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} minHeight={0}>
      <Box flexDirection="column" flexGrow={1} minHeight={0} borderStyle="round" borderColor={COLORS.border} paddingX={1}>
        {rows.length === 0 ? (
          <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
            <Text color={COLORS.textDim}>{"No messages yet"}</Text>
          </Box>
        ) : (
          rows
        )}
      </Box>
      <Box flexShrink={0}>
        <PromptDisplay input={input} streaming={streaming} />
      </Box>
    </Box>
  );
}
