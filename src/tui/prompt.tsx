import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "./theme.js";

interface PromptProps {
  input: string;
  streaming: boolean;
  placeholder?: string;
}

export function PromptDisplay({ input, streaming, placeholder = "Ask anything..." }: PromptProps) {
  const showSlash = input.startsWith("/");

  return (
    <Box width="100%" flexDirection="row" flexShrink={0}>
      <Box marginRight={1} flexShrink={0}>
        <Text bold color={streaming ? COLORS.primaryDim : showSlash ? COLORS.accent : COLORS.primary}>
          {streaming ? "\u25CF" : showSlash ? "\u002F" : "\u203A"}
        </Text>
      </Box>
      <Box flexGrow={1}>
        {streaming ? (
          <Text color={COLORS.primaryDim}>generating...</Text>
        ) : (
          <>
            <Text color={COLORS.text}>
              {input || <Text color={COLORS.textMuted}>{placeholder}</Text>}
            </Text>
            <Text color={COLORS.primary}>{"\u258C"}</Text>
          </>
        )}
      </Box>
    </Box>
  );
}
