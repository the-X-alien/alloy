import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "./theme.js";
import type { Session } from "../session/manager.js";

interface StatusBarProps {
  session: Session | null;
  provider: string;
  model: string;
  spent: number;
  budget: number;
  messages: number;
}

export function StatusBar({ session, provider, model, spent, budget, messages }: StatusBarProps) {
  const remaining = budget - spent;
  const costColor = remaining < 1 ? COLORS.error : remaining < 3 ? COLORS.warning : COLORS.success;

  return (
    <Box
      borderStyle="single"
      borderColor={COLORS.border}
      paddingX={1}
      justifyContent="space-between"
      width="100%"
    >
      <Box gap={2}>
        <Box>
          <Text color={COLORS.textDim}>{"session: "}</Text>
          <Text color={COLORS.textBright}>{session?.title ?? "none"}</Text>
        </Box>
        <Box>
          <Text color={COLORS.textDim}>{"msgs: "}</Text>
          <Text color={COLORS.text}>{String(messages)}</Text>
        </Box>
      </Box>
      <Box gap={2}>
        <Box>
          <Text color={COLORS.textDim}>{"model: "}</Text>
          <Text color={COLORS.accent}>{provider}</Text>
          <Text color={COLORS.text}>{"/"}</Text>
          <Text color={COLORS.accentDim}>{model}</Text>
        </Box>
        <Box>
          <Text color={COLORS.textDim}>{"cost: "}</Text>
          <Text color={costColor}>{`$${spent.toFixed(4)}`}</Text>
          <Text color={COLORS.textDim}>{` / $${budget.toFixed(2)}`}</Text>
        </Box>
      </Box>
    </Box>
  );
}
