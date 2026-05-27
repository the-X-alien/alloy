import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";

interface ToolCallDisplayProps {
  name: string;
  args?: string;
  result?: string;
}

export function ToolCallDisplay({ name, args, result }: ToolCallDisplayProps) {
  return (
    <Box flexDirection="column" marginLeft={2} marginBottom={1}>
      <Box>
        <Text color={COLORS.secondary}>  Tool: {name}</Text>
      </Box>
      {args && (
        <Box marginLeft={2}>
          <Text color={COLORS.textDim}>{args.slice(0, 100)}{args.length > 100 ? "..." : ""}</Text>
        </Box>
      )}
      {result && (
        <Box marginLeft={2}>
          <Text color={COLORS.textMuted}>{result.slice(0, 100)}{result.length > 100 ? "..." : ""}</Text>
        </Box>
      )}
    </Box>
  );
}
