import React from "react";
import { Text, Box, useStdout } from "ink";
import { PromptDisplay } from "./prompt.js";
import { COLORS } from "./theme.js";
import { Spinner } from "./spinner.js";
import type { ChatMessage } from "../providers/interface.js";

interface SessionProps {
  messages: ChatMessage[];
  streaming: boolean;
  streamContent: string;
  input: string;
  scrollOffset: number;
  onScrollChange: (offset: number) => void;
}

function DisplayMessage({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box
        flexDirection="column"
        paddingX={1}
        paddingY={0}
        {...(isUser ? { backgroundColor: COLORS.bgElement } : {})}
        borderRadius={0}
      >
        <Box>
          <Text bold color={isUser ? COLORS.text : COLORS.primary}>
            {isUser ? "\u25C9 You" : "\u25C9 Alloy"}
          </Text>
          {msg.model && (
            <Text color={COLORS.textMuted}> {msg.model}</Text>
          )}
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

let termHeight = 24;

export function Session({ messages, streaming, streamContent, input, scrollOffset, onScrollChange }: SessionProps) {
  const { stdout } = useStdout();
  termHeight = stdout.rows || 24;
  const termWidth = stdout.columns || 80;
  const availableLines = termHeight - 6;
  const avgMsgLines = 4;
  const maxVisible = Math.max(3, Math.floor(availableLines / avgMsgLines));

  const totalItems = messages.length + (streaming ? 1 : 0);
  const maxScroll = Math.max(0, totalItems - maxVisible);
  const clampedOffset = Math.min(scrollOffset, maxScroll);
  const startIdx = Math.max(0, totalItems - maxVisible - clampedOffset);

  const visibleMessages = messages.slice(startIdx);
  const canScrollUp = clampedOffset < maxScroll;
  const canScrollDown = clampedOffset > 0;

  const rows: React.ReactNode[] = [];

  for (const msg of visibleMessages) {
    rows.push(<DisplayMessage key={`msg-${msg.timestamp}`} msg={msg} />);
  }

  if (streaming) {
    rows.push(
      <Box key="stream" flexDirection="column" marginBottom={1}>
        <Box flexDirection="column" paddingX={1}>
          <Box>
            <Spinner color={COLORS.primary} />
            <Text bold color={COLORS.primary}>{" Alloy"}</Text>
            <Text color={COLORS.primaryDim}>{" generating"}</Text>
          </Box>
          <Box marginLeft={2}>
            <Text color={COLORS.text}>{streamContent || " "}</Text>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} minHeight={0}>
      <Box flexDirection="column" flexGrow={1} minHeight={0} paddingX={1}>
        {canScrollUp && (
          <Box flexShrink={0}>
            <Text color={COLORS.textMuted}>{"\u2191 "}{clampedOffset}{" more \u2014 PgUp to scroll"}</Text>
          </Box>
        )}
        {rows.length === 0 ? (
          <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
            <Text color={COLORS.textMuted}>No messages yet</Text>
          </Box>
        ) : (
          rows
        )}
        {canScrollDown && (
          <Box flexShrink={0}>
            <Text color={COLORS.textMuted}>{"\u2193 PgDn to scroll back"}</Text>
          </Box>
        )}
      </Box>
      <Box
        flexShrink={0}
        width="100%"
        borderStyle="single"
        borderColor={COLORS.borderSubtle}
        paddingX={1}
        backgroundColor={COLORS.bgPanel}
      >
        <PromptDisplay input={input} streaming={streaming} />
      </Box>
    </Box>
  );
}
