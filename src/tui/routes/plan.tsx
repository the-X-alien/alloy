import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";
import type { PlanArtifact, PlanStep } from "../../agent/types.js";

interface PlanViewProps {
  plan: PlanArtifact | null;
}

export function PlanView({ plan }: PlanViewProps) {
  if (!plan) {
    return (
      <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center">
        <Text color={COLORS.textMuted}>No plan artifact yet</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} padding={1}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>{plan.title}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={COLORS.text}>{plan.goal}</Text>
      </Box>
      <Box borderStyle="single" borderColor={COLORS.borderSubtle} padding={1}>
        <Text bold color={COLORS.text}>Steps</Text>
        {plan.steps.map((step, i) => (
          <StepItem key={step.id} step={step} index={i} />
        ))}
      </Box>
    </Box>
  );
}

function StepItem({ step, index }: { step: PlanStep; index: number }) {
  const statusIcon = step.status === "done" ? "\u2713" :
    step.status === "running" ? "\u25D4" :
    step.status === "failed" ? "\u2717" : "\u25CB";

  const statusColor = step.status === "done" ? COLORS.success :
    step.status === "running" ? COLORS.warning :
    step.status === "failed" ? COLORS.error : COLORS.textMuted;

  return (
    <Box flexDirection="column" marginTop={1}>
      <Box>
        <Text color={statusColor}>{statusIcon}</Text>
        <Text color={COLORS.text}> Step {index + 1}: {step.description}</Text>
      </Box>
      {step.files && step.files.length > 0 && (
        <Box marginLeft={3}>
          {step.files.map(f => (
            <Text key={f} color={COLORS.textMuted}>  {f}</Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
