import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";
import { Spinner } from "../spinner.js";

interface ThinkingProps {
  label?: string;
}

export function Thinking({ label = "thinking" }: ThinkingProps) {
  return (
    <Box>
      <Spinner color={COLORS.accent} />
      <Text color={COLORS.accentDim}> {label}...</Text>
    </Box>
  );
}
