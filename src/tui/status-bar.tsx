import React from "react";
import { Text, Box } from "ink";
import { COLORS, providerColor, formatCost } from "./theme.js";
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
  const pColor = providerColor(provider);

  return (
    <Box
      borderStyle="single"
      borderColor={COLORS.border}
      paddingX={1}
      justifyContent="space-between"
      width="100%"
      flexShrink={0}
    >
      <Box gap={2}>
        <Text color={COLORS.textDim}>
          {"session: "}
          <Text color={COLORS.textBright}>{session?.title ?? "default"}</Text>
        </Text>
        <Text color={COLORS.textDim}>
          {"msgs: "}
          <Text color={COLORS.text}>{String(messages)}</Text>
        </Text>
      </Box>
      <Box gap={2}>
        <Text color={COLORS.textDim}>
          {"model: "}
          <Text color={pColor}>{provider}</Text>
          <Text color={COLORS.textDim}>/</Text>
          <Text color={COLORS.text}>{model}</Text>
        </Text>
        <Text color={COLORS.textDim}>
          {"cost: "}
          <Text color={costColor}>{formatCost(spent)}</Text>
          <Text color={COLORS.textDim}>{` / $${budget.toFixed(2)}`}</Text>
        </Text>
      </Box>
    </Box>
  );
}
