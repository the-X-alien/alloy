import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { Logo, COLORS } from "../../theme.js";

interface OnboardingProps {
  onComplete: (keys: Record<string, string>) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [keys, setKeys] = useState<Record<string, string>>({});

  const pages = [
    {
      title: "Welcome to Alloy",
      content: [
        "A multi-model AI coding agent.",
        "",
        "Supports OpenAI, Anthropic, Google, DeepSeek, Groq, and more.",
        "Press Enter to continue.",
      ],
    },
    {
      title: "API Keys",
      content: [
        "Set environment variables for the providers you want to use:",
        "",
        "  OPENAI_API_KEY     - OpenAI (GPT-4o, o3, etc.)",
        "  ANTHROPIC_API_KEY  - Anthropic (Claude Sonnet, Opus)",
        "  GEMINI_API_KEY     - Google Gemini",
        "  DEEPSEEK_API_KEY   - DeepSeek",
        "",
        "Press Enter to continue.",
      ],
    },
    {
      title: "Ready!",
      content: [
        "You're all set. Type /help for commands.",
        "",
        "Quick tips:",
        "  Ctrl+K  Command palette",
        "  Ctrl+M  Switch model",
        "  Ctrl+P  Connect provider",
        "  Ctrl+1-9 Switch between configured providers",
        "",
        "Press Enter to start.",
      ],
    },
  ];

  const page = pages[step];

  useInput((_input, key) => {
    if (key.return) {
      if (step < pages.length - 1) {
        setStep(prev => prev + 1);
      } else {
        onComplete(keys);
      }
    }
  });

  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" padding={2}>
      <Logo />
      <Box height={1} />
      <Text bold color={COLORS.primary}>{page.title}</Text>
      <Box height={1} />
      {page.content.map((line, i) => (
        <Text key={i} color={COLORS.text}>{line}</Text>
      ))}
      <Box height={1} />
      <Text color={COLORS.textMuted}>Step {step + 1} of {pages.length} - Press Enter to continue</Text>
    </Box>
  );
}
