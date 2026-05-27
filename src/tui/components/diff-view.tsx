import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";

interface DiffViewProps {
  diff: string;
  maxLines?: number;
}

export function DiffView({ diff, maxLines = 20 }: DiffViewProps) {
  const lines = diff.split("\n").slice(0, maxLines);

  return (
    <Box flexDirection="column" paddingX={1}>
      {lines.map((line, i) => {
        let color = COLORS.text;
        if (line.startsWith("+")) color = COLORS.diffAdd;
        else if (line.startsWith("-")) color = COLORS.diffRemove;
        else if (line.startsWith("@")) color = COLORS.info;
        else if (line.startsWith("diff") || line.startsWith("---") || line.startsWith("+++")) color = COLORS.textMuted;

        let bg = undefined;
        if (line.startsWith("+")) bg = COLORS.diffAddDim;
        else if (line.startsWith("-")) bg = COLORS.diffRemoveDim;

        return (
          <Box key={i} backgroundColor={bg}>
            <Text color={color}>{line || " "}</Text>
          </Box>
        );
      })}
      {diff.split("\n").length > maxLines && (
        <Text color={COLORS.textMuted}>... {diff.split("\n").length - maxLines} more lines</Text>
      )}
    </Box>
  );
}
