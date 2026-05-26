import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS, providerColor } from "../theme.js";

interface ProviderEntry {
  id: string;
  name: string;
  configured: boolean;
  apiKeyEnv: string;
}

interface ProviderConnectProps {
  providers: ProviderEntry[];
  onConfigure: (providerId: string, apiKey: string) => void;
  onClose: () => void;
}

export function ProviderConnect({ providers, onConfigure, onClose }: ProviderConnectProps) {
  const [cursor, setCursor] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");

  useInput((_input, key) => {
    if (key.escape) {
      if (selected) { setSelected(null); setApiKey(""); return; }
      onClose();
      return;
    }

    if (selected) {
      if (key.return) {
        if (apiKey.trim()) {
          onConfigure(selected, apiKey.trim());
        }
        setSelected(null);
        setApiKey("");
        return;
      }
      if (key.backspace || key.delete) {
        setApiKey(prev => prev.slice(0, -1));
        return;
      }
      if (_input && !key.ctrl && !key.meta) {
        setApiKey(prev => prev + _input);
        return;
      }
      return;
    }

    if (key.return) {
      const p = providers[cursor];
      if (!p.configured) setSelected(p.id);
      return;
    }

    if (key.upArrow) { setCursor(prev => Math.max(0, prev - 1)); return; }
    if (key.downArrow) { setCursor(prev => Math.min(providers.length - 1, prev + 1)); return; }
  });

  if (selected) {
    const p = providers.find(p => p.id === selected);
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" borderStyle="round" borderColor={COLORS.accent} padding={2}>
        <Text bold color={COLORS.accent}>{`Configure ${p?.name || selected}`}</Text>
        <Box height={1} />
        <Text color={COLORS.textDim}>{`Enter your ${p?.apiKeyEnv || "API key"}:`}</Text>
        <Box height={1} />
        <Box borderStyle="round" borderColor={COLORS.accent} paddingX={1} width="60%">
          <Text>{apiKey || <Text color={COLORS.textDim}>{"Paste API key..."}</Text>}</Text>
          <Text color={COLORS.accent}>{"\u258C"}</Text>
        </Box>
        <Box height={1} />
        <Text color={COLORS.textDim}>{"Enter confirm | Esc back"}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Text bold color={COLORS.accent}>{"Connect Provider"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Box flexDirection="column" flexGrow={1}>
        {providers.map((p, i) => {
          const pColor = providerColor(p.id);
          return (
            <Box key={p.id}>
              <Text color={i === cursor ? pColor : COLORS.text}>
                {i === cursor ? "\u25B6 " : "  "}
                {p.configured ? "\u25C9 " : "\u25CB "}
                <Text color={pColor}>{p.name}</Text>
                {p.configured ? <Text color={COLORS.success}>{" configured"}</Text> : null}
              </Text>
            </Box>
          );
        })}
      </Box>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.textDim}>{"Up/Down navigate | Enter configure | Esc close"}</Text>
    </Box>
  );
}
