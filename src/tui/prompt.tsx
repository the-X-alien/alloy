import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "./theme.js";

interface PromptProps {
  input: string;
  streaming: boolean;
  placeholder?: string;
}

export function PromptDisplay({ input, streaming, placeholder = "Type /help for commands..." }: PromptProps) {
  const showSlash = input.startsWith("/");
  const showText = input.length > 0;

  return (
    <Box
      borderStyle="single"
      borderColor={streaming ? COLORS.accentDim : showSlash ? COLORS.accent : showText ? COLORS.surfaceLighter : COLORS.border}
      paddingX={1}
      flexShrink={0}
    >
      <Box>
        <Text>
          <Text color={streaming ? COLORS.accentDim : showSlash ? COLORS.accent : COLORS.success}>
            {streaming ? " * " : showSlash ? " / " : " > "}
          </Text>
          {streaming ? (
            <Text color={COLORS.accentDim}>{"Generating..."}</Text>
          ) : (
            <>
              <Text color={COLORS.text}>
                {input || <Text color={COLORS.textDim}>{placeholder}</Text>}
              </Text>
              <Text color={COLORS.accent} underline={false}>{"\u258C"}</Text>
            </>
          )}
        </Text>
      </Box>
    </Box>
  );
}
