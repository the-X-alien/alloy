import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS, providerColor } from "../theme.js";

interface ModelOption {
  modelId: string;
  providerId: string;
  configured: boolean;
}

interface ModelPickerProps {
  models: ModelOption[];
  currentModel: string;
  currentProvider: string;
  onSelect: (model: string, provider: string) => void;
  onClose: () => void;
}

export function ModelPicker({ models, currentModel, currentProvider, onSelect, onClose }: ModelPickerProps) {
  const [cursor, setCursor] = useState(0);

  const available = models.filter(m => m.configured);
  const allModels = available.length > 0 ? available : models;

  useInput((_input, key) => {
    if (key.escape) { onClose(); return; }
    if (key.return) {
      const m = allModels[cursor];
      if (m) onSelect(m.modelId, m.providerId);
      return;
    }
    if (key.upArrow) { setCursor(prev => Math.max(0, prev - 1)); return; }
    if (key.downArrow) { setCursor(prev => Math.min(allModels.length - 1, prev + 1)); return; }
  });

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Text bold color={COLORS.accent}>{"Switch Model"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Box flexDirection="column" flexGrow={1}>
        {allModels.map((m, i) => {
          const active = m.modelId === currentModel && m.providerId === currentProvider;
          const pColor = providerColor(m.providerId);
          return (
            <Box key={`${m.providerId}-${m.modelId}`}>
              <Text color={i === cursor ? pColor : COLORS.text}>
                {i === cursor ? "\u25B6 " : "  "}
                {active ? "\u25C9 " : "\u25CB "}
                <Text color={pColor}>{m.providerId}</Text>
                <Text color={COLORS.textDim}>/</Text>
                <Text color={i === cursor ? COLORS.accent : COLORS.text}>{m.modelId}</Text>
                {active && <Text color={COLORS.success}>{" (active)"}</Text>}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.textDim}>{"Up/Down navigate | Enter select | Esc close"}</Text>
    </Box>
  );
}
