import React from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";
import type { PlanArtifact, PlanStep } from "../../agent/types.js";

interface PlanViewerDialogProps {
  plan: PlanArtifact | null;
  onClose: () => void;
}

export function PlanViewerDialog({ plan, onClose }: PlanViewerDialogProps) {
  useInput((_input, key) => {
    if (key.escape) onClose();
  });

  if (!plan) {
    return (
      <Box padding={1} backgroundColor={COLORS.bgPanel} borderStyle="round" borderColor={COLORS.border}>
        <Text color={COLORS.textMuted}>No plan artifact available</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} width={80} backgroundColor={COLORS.bgPanel}
      borderStyle="round" borderColor={COLORS.border}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>{plan.title}</Text>
      </Box>
      <Box marginBottom={1}>
        <Text color={COLORS.text}>{plan.goal}</Text>
      </Box>
      {plan.steps.map((step, i) => (
        <Box key={step.id} flexDirection="column" marginTop={1}>
          <Box>
            <Text color={step.status === "done" ? COLORS.success :
              step.status === "failed" ? COLORS.error : COLORS.textMuted}>
              {step.status === "done" ? "\u2713" : step.status === "failed" ? "\u2717" : "\u25CB"}
            </Text>
            <Text color={COLORS.text}> Step {i + 1}: {step.description}</Text>
          </Box>
          {step.files && step.files.length > 0 && (
            <Box marginLeft={3}>
              {step.files.map(f => (
                <Text key={f} color={COLORS.textDim}>  {f}</Text>
              ))}
            </Box>
          )}
        </Box>
      ))}
      <Box marginTop={1}>
        <Text color={COLORS.textMuted}>Esc to close</Text>
      </Box>
    </Box>
  );
}
