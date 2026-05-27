import React from "react";
import { Text, Box, useInput } from "ink";
import { COLORS, providerColor, formatCost } from "../theme.js";
import { getProviderConfigs } from "../../providers/registry.js";

interface SettingsProps {
  provider: string;
  model: string;
  messages: number;
  spent: number;
  budget: number;
  onClose: () => void;
}

export function SettingsDialog({ provider, model, messages, spent, budget, onClose }: SettingsProps) {
  const allConfigs = getProviderConfigs();
  const configured = allConfigs.filter(c => {
    const key = process.env[c.apiKeyEnv];
    return !!key;
  });

  useInput((_input, key) => {
    if (key.escape) { onClose(); return; }
  });

  const pColor = providerColor(provider);
  const remaining = budget - spent;

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Text bold color={COLORS.accent}>{"Settings"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>

      <Text bold color={COLORS.text}>{"Active Model"}</Text>
      <Text color={COLORS.text}>
        {"  "}
        <Text color={pColor}>{provider}</Text>
        <Text color={COLORS.textDim}>/</Text>
        <Text>{model}</Text>
      </Text>
      <Box height={1} />

      <Text bold color={COLORS.text}>{"Configured Providers"}</Text>
      {configured.length === 0 ? (
        <Text color={COLORS.warning}>{"  None configured"}</Text>
      ) : (
        configured.map(c => (
          <Text key={c.id} color={COLORS.text}>
            {"  \u2713 "}
            <Text color={providerColor(c.id)}>{c.name}</Text>
            <Text color={COLORS.textDim}>{` (${c.apiKeyEnv})`}</Text>
          </Text>
        ))
      )}
      <Box height={1} />

      <Text bold color={COLORS.text}>{"Session"}</Text>
      <Text color={COLORS.text}>{`  Messages: ${messages}`}</Text>
      <Text color={COLORS.text}>{`  Cost spent: ${formatCost(spent)}`}</Text>
      <Text color={COLORS.text}>{`  Budget remaining: `}
        <Text color={remaining < 1 ? COLORS.error : remaining < 3 ? COLORS.warning : COLORS.success}>
          {formatCost(remaining)}
        </Text>
        <Text color={COLORS.textDim}>{` / $${budget.toFixed(2)}`}</Text>
      </Text>
      <Box height={1} />

      <Text bold color={COLORS.text}>{"Version"}</Text>
      <Text color={COLORS.textDim}>{"  alloy-cli v0.1.0"}</Text>
      <Text color={COLORS.textDim}>{"  github.com/the-X-alien/alloy"}</Text>

      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.accent}>{"Press Escape to close"}</Text>
    </Box>
  );
}
