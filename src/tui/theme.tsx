import { Text, Box } from "ink";
import React from "react";

export const COLORS = {
  bg: "#0a0a0a",
  bgPanel: "#141414",
  bgElement: "#1e1e1e",
  bgHover: "#282828",
  border: "#484848",
  borderActive: "#606060",
  borderSubtle: "#3c3c3c",
  text: "#eeeeee",
  textMuted: "#808080",
  textDim: "#606060",
  primary: "#fab283",
  primaryDim: "#d4915f",
  secondary: "#5c9cf5",
  secondaryDim: "#3a7ad8",
  accent: "#9d7cd8",
  accentDim: "#7a5cb8",
  success: "#7fd88f",
  successDim: "#5ab86a",
  warning: "#f5a742",
  warningDim: "#d4882e",
  error: "#e06c75",
  errorDim: "#c04a55",
  info: "#56b6c2",
  infoDim: "#3a94a0",
  diffAdd: "#4fd6be",
  diffRemove: "#c53b53",
  diffAddDim: "#20303b",
  diffRemoveDim: "#37222c",
  provider: {
    openai: "#4fd6be",
    anthropic: "#fab283",
    google: "#5c9cf5",
    deepseek: "#9d7cd8",
    xai: "#000000",
    openrouter: "#e06c75",
    groq: "#f5a742",
    ollama: "#ffffff",
    default: "#808080",
  },
};

export const LOGO_ASCII = [
  "░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░",
  "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░",
  "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░",
  "░▒▓████████▓▒░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░░▒▓██████▓▒░",
  "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░",
  "░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░     ░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░",
  "░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓██████▓▒░   ░▒▓█▓▒░",
];

const LOGO_COLORS = [
  COLORS.primary,
  COLORS.primaryDim,
  COLORS.primaryDim,
  COLORS.secondary,
  COLORS.accent,
  COLORS.accent,
  COLORS.textMuted,
];

export function Logo() {
  return (
    <Box flexDirection="column">
      {LOGO_ASCII.slice(0, 6).map((line, i) => (
        <Box key={`logo-${i}`}>
          <Text color={LOGO_COLORS[i]}>{line}</Text>
        </Box>
      ))}
      <Box marginTop={0}>
        <Text color={COLORS.textMuted}>{LOGO_ASCII[6]}</Text>
      </Box>
    </Box>
  );
}

export function providerColor(provider: string): string {
  return (COLORS.provider as any)[provider] ?? COLORS.provider.default;
}

export function formatCost(cents: number): string {
  if (cents < 0.01) return "<$0.0001";
  return `$${cents.toFixed(4)}`;
}
