import { Text, Box } from "ink";

export const COLORS = {
  accent: "#7C5CFC",
  accentDim: "#5A3FB5",
  accentBright: "#A78BFA",
  success: "#34D399",
  successDim: "#059669",
  warning: "#FBBF24",
  warningDim: "#D97706",
  error: "#F87171",
  errorDim: "#DC2626",
  surface: "#0F111A",
  surfaceLight: "#1E2030",
  surfaceLighter: "#2A2D42",
  border: "#3B3D5C",
  borderLight: "#4A4D6E",
  text: "#E2E8F0",
  textDim: "#6B7280",
  textBright: "#F8FAFC",
  provider: {
    openai: "#00A67E",
    anthropic: "#D4A574",
    google: "#4285F4",
    deepseek: "#4F6BED",
    xai: "#000000",
    openrouter: "#FF6B6B",
    groq: "#F97316",
    ollama: "#FFFFFF",
    default: "#7C5CFC",
  },
};

export type Theme = "dark" | "light";

export function detectTheme(): Theme {
  return "dark";
}

export const LOGO_ASCII = [
  "    _    _ _                 ",
  "   / \\  | | | ___  _   _    ",
  "  / _ \\ | | |/ _ \\| | | |   ",
  " / ___ \\| | | (_) | |_| |   ",
  "/_/   \\_\\_|_|\\___/ \\__, |   ",
  "                    |___/    ",
  "  multi-model AI coding agent",
];

export const LOGO_COLORS = [
  COLORS.accent,
  COLORS.accentDim,
  COLORS.accentBright,
  COLORS.success,
  COLORS.warning,
  COLORS.error,
  COLORS.textDim,
];

function LogoLine({ text, color, bold }: { text: string; color: string; bold?: boolean }) {
  return (
    <Text color={color} bold={bold ?? false}>
      {text}
    </Text>
  );
}

export function Logo() {
  return (
    <Box flexDirection="column" marginLeft={0}>
      {LOGO_ASCII.slice(0, 6).map((line, i) => (
        <Box key={`logo-${i}`}>
          <Text color={LOGO_COLORS[i]} bold>{line}</Text>
        </Box>
      ))}
      <Box marginTop={0}>
        <Text color={COLORS.textDim}>{LOGO_ASCII[6]}</Text>
      </Box>
    </Box>
  );
}

export function MiniLogo() {
  return (
    <Box>
      <Text bold color={COLORS.accent}>{"a"}</Text>
      <Text bold color={COLORS.accentDim}>{"l"}</Text>
      <Text bold color={COLORS.accentBright}>{"l"}</Text>
      <Text bold color={COLORS.success}>{"o"}</Text>
      <Text bold color={COLORS.warning}>{"y"}</Text>
      <Text color={COLORS.textDim}>{" v0.0.1"}</Text>
    </Box>
  );
}

export function providerColor(provider: string): string {
  return (COLORS.provider as any)[provider] ?? COLORS.provider.default;
}
