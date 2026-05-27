import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";

interface Command {
  id: string;
  title: string;
  category: string;
  run: () => void;
}

interface CommandPaletteProps {
  commands: Command[];
  onClose: () => void;
}

export function CommandPalette({ commands, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);

  const filtered = query
    ? commands.filter(c =>
        c.title.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  useInput((_input, key) => {
    if (key.escape) { onClose(); return; }
    if (key.return) {
      if (filtered[cursor]) filtered[cursor].run();
      return;
    }
    if (key.upArrow) { setCursor(prev => Math.max(0, prev - 1)); return; }
    if (key.downArrow) { setCursor(prev => Math.min(filtered.length - 1, prev + 1)); return; }
    if (key.backspace || key.delete) { setQuery(prev => prev.slice(0, -1)); setCursor(0); return; }
    if (_input && !key.ctrl && !key.meta) { setQuery(prev => prev + _input); setCursor(0); return; }
  });

  const display = filtered.slice(0, 12);

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Box borderStyle="single" borderColor={COLORS.borderActive} paddingX={1}>
        <Text>{"> "}{query}<Text color={COLORS.accent}>{"\u258C"}</Text></Text>
      </Box>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Box flexDirection="column" flexGrow={1}>
        {display.length === 0 ? (
          <Text color={COLORS.textDim}>{"No matching commands"}</Text>
        ) : (
          display.map((cmd, i) => (
            <Box key={cmd.id}>
              <Text color={i === cursor ? COLORS.accent : COLORS.text}>
                {i === cursor ? "\u25B6 " : "  "}
                <Text color={COLORS.textDim}>{cmd.category}</Text>
                {" / "}
                <Text color={i === cursor ? COLORS.accent : COLORS.text}>{cmd.title}</Text>
              </Text>
            </Box>
          ))
        )}
      </Box>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.textDim}>{`${display.length} of ${filtered.length} commands`}</Text>
      <Text color={COLORS.textDim}>{"Type to filter | Enter execute | Esc close"}</Text>
    </Box>
  );
}
