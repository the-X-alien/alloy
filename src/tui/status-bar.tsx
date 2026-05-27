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

function shortenModel(m: string): string {
  const parts = m.split("/");
  const name = parts[parts.length - 1] || m;
  if (name.length <= 18) return name;
  if (name.includes("-")) {
    const segs = name.split("-");
    return segs.slice(0, 3).join("-").slice(0, 20);
  }
  return name.slice(0, 18);
}

export function StatusBar({ session, provider, model, spent, budget, messages }: StatusBarProps) {
  const remaining = budget - spent;
  const costColor = remaining < 1 ? COLORS.error : remaining < 3 ? COLORS.warning : COLORS.success;

  return (
    <Box
      backgroundColor={COLORS.bgPanel}
      paddingX={1}
      width="100%"
      flexShrink={0}
      minHeight={1}
    >
      <Text>
        <Text color={COLORS.textMuted}>{"session "}</Text>
        <Text color={COLORS.text}>{session?.title ?? "default"}</Text>
        <Text color={COLORS.borderSubtle}>{" | "}</Text>
        <Text color={COLORS.textMuted}>{messages}</Text>
        <Text color={COLORS.textMuted}>{" msg"}</Text>
        <Text color={COLORS.borderSubtle}>{" | "}</Text>
        <Text color={providerColor(provider)}>{provider}</Text>
        <Text color={COLORS.textMuted}>/</Text>
        <Text color={COLORS.text}>{shortenModel(model)}</Text>
        <Text color={COLORS.borderSubtle}>{" | "}</Text>
        <Text color={costColor}>{formatCost(spent)}</Text>
        <Text color={COLORS.textMuted}>{"/"}</Text>
        <Text color={COLORS.textDim}>{formatCost(budget)}</Text>
      </Text>
    </Box>
  );
}
