import React, { useState, useCallback } from "react";
import { Text, Box, useInput } from "ink";
import { Logo, COLORS } from "../theme.js";

type Step = "welcome" | "anthropic" | "openai" | "openrouter" | "done";

let stuckKey: string | null = null;

export function trySetStuckKey(key: string) {
  stuckKey = key;
}

interface OnboardingProps {
  onComplete: (keys: Record<string, string>) => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState<Step>("welcome");
  const [input, setInput] = useState("");
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useInput((_input, key) => {
    if (step === "welcome") {
      if (key.return) {
        setStep(stuckKey ? "anthropic" : "done");
        if (!stuckKey) onComplete({});
      }
      return;
    }

    if (step === "done") {
      if (key.return) onComplete(keys);
      return;
    }

    if (key.return) {
      const val = input.trim();
      if (!val) { setError("API key cannot be empty"); return; }

      let envKey = "";
      if (step === "anthropic") envKey = "ANTHROPIC_API_KEY";
      else if (step === "openai") envKey = "OPENAI_API_KEY";
      else if (step === "openrouter") envKey = "OPENROUTER_API_KEY";

      const newKeys = { ...keys, [envKey]: val };
      setKeys(newKeys);

      if (stuckKey) {
        process.env[envKey] = val;
      }

      const nextStep: Record<string, Step | undefined> = {
        anthropic: stuckKey ? "done" : "openai",
        openai: "openrouter",
        openrouter: "done",
      };

      const next = nextStep[step];
      if (next === "done" || !next) {
        for (const [k, v] of Object.entries(newKeys)) {
          process.env[k] = v;
        }
        setStep("done");
      } else {
        setStep(next);
      }
      setInput("");
      setError("");
      return;
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      setError("");
      return;
    }

    if (_input && !key.ctrl && !key.meta) {
      setInput(prev => prev + _input);
    }
  });

  const skipToDone = useCallback(() => {
    for (const [k, v] of Object.entries(keys)) process.env[k] = v;
    setStep("done");
  }, [keys]);

  if (step === "welcome") {
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" padding={2}>
        <Logo />
        <Box height={1} />
        <Text bold color={COLORS.textBright}>{"Welcome to Alloy"}</Text>
        <Box height={1} />
        <Text color={COLORS.text}>{"Multi-model AI coding agent"}</Text>
        <Text color={COLORS.textDim}>{"Combine the best models. Avoid the rest."}</Text>
        <Box height={1} />
        {stuckKey ? (
          <Text color={COLORS.warning}>{"You need to configure at least one API key to continue."}</Text>
        ) : null}
        <Text color={COLORS.textDim}>{"Press Enter to set up your first provider"}</Text>
        {!stuckKey ? (
          <Text color={COLORS.textDim}>{"Or press Esc to skip and set keys later"}</Text>
        ) : null}
      </Box>
    );
  }

  if (step === "done") {
    const count = Object.keys(keys).length;
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" padding={2}>
        <Logo />
        <Box height={1} />
        <Text bold color={COLORS.success}>{"\u2713 Alloy is ready!"}</Text>
        <Box height={1} />
        <Text color={COLORS.text}>{count > 0 ? `Configured ${count} API key${count > 1 ? "s" : ""}` : "No API keys configured yet"}</Text>
        {count > 0 ? (
          <Box flexDirection="column" alignItems="center">
            {Object.entries(keys).map(([k]) => (
              <Text key={k} color={COLORS.textDim}>{`  \u2713 ${k}`}</Text>
            ))}
          </Box>
        ) : null}
        <Box height={1} />
        <Text color={COLORS.textDim}>{"Run /help for commands or /connect to add providers later"}</Text>
        <Text color={COLORS.accent}>{"Press Enter to start"}</Text>
      </Box>
    );
  }

  const providerNames: Record<string, string> = {
    anthropic: "Anthropic (Claude)",
    openai: "OpenAI (GPT)",
    openrouter: "OpenRouter (multi-model)",
  };

  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" padding={2}>
      <Text bold color={COLORS.accent}>{`Set up ${providerNames[step] || step}`}</Text>
      <Box height={1} />
      <Text color={COLORS.textDim}>{`Paste your ${step === "openrouter" ? "OpenRouter" : step === "anthropic" ? "Anthropic" : "OpenAI"} API key:`}</Text>
      <Box height={1} />
      <Box borderStyle="round" borderColor={COLORS.accent} paddingX={1} width="60%">
        <Text color={COLORS.text}>{input || <Text color={COLORS.textDim}>{"sk-..."}</Text>}</Text>
        <Text color={COLORS.accent}>{"\u258C"}</Text>
      </Box>
      {error && <Text color={COLORS.error}>{error}</Text>}
      <Box height={1} />
      <Text color={COLORS.textDim}>{"Enter to confirm | Backspace to edit | Esc to skip"}</Text>
    </Box>
  );
}
