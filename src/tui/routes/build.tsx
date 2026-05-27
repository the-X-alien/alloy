import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";
import { Spinner } from "../spinner.js";
import type { PlanStep } from "../../agent/types.js";

interface BuildViewProps {
  steps: PlanStep[];
  logs: string[];
}

export function BuildView({ steps, logs }: BuildViewProps) {
  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.success}>Build in progress</Text>
      </Box>
      <Box flexDirection="column" marginBottom={1}>
        {steps.map((step, i) => (
          <Box key={step.id} marginTop={0}>
            <BuildStepItem step={step} index={i} />
          </Box>
        ))}
      </Box>
      {logs.length > 0 && (
        <Box flexDirection="column" borderStyle="single" borderColor={COLORS.borderSubtle} padding={1} flexGrow={1}>
          <Text bold color={COLORS.textMuted}>Live Logs</Text>
          {logs.slice(-10).map((log, i) => (
            <Text key={i} color={COLORS.textDim}>{log}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}

function BuildStepItem({ step, index }: { step: PlanStep; index: number }) {
  const statusIcon = step.status === "done" ? "\u2713" :
    step.status === "running" ? "\u25D4" :
    step.status === "failed" ? "\u2717" : "\u25CB";

  const statusColor = step.status === "done" ? COLORS.success :
    step.status === "running" ? COLORS.warning :
    step.status === "failed" ? COLORS.error : COLORS.textMuted;

  return (
    <Box>
      {step.status === "running" ? (
        <Spinner color={statusColor} />
      ) : (
        <Text color={statusColor}>{statusIcon}</Text>
      )}
      <Text color={COLORS.text}> Step {index + 1}: {step.description}</Text>
    </Box>
  );
}
