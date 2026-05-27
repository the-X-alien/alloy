import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";
import type { MemoryEntry } from "../../memory/types.js";

interface MemoryBrowserDialogProps {
  entries: MemoryEntry[];
  onSearch: (query: string) => void;
  onClose: () => void;
}

export function MemoryBrowserDialog({ entries, onSearch, onClose }: MemoryBrowserDialogProps) {
  const [cursor, setCursor] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mode, setMode] = useState<"browse" | "search">("browse");

  useInput((input, key) => {
    if (key.escape) { onClose(); return; }
    if (mode === "search") {
      if (key.return) {
        onSearch(searchQuery);
        setMode("browse");
        return;
      }
      if (key.backspace) { setSearchQuery(prev => prev.slice(0, -1)); return; }
      if (input >= " " && !key.ctrl) { setSearchQuery(prev => prev + input); return; }
      return;
    }
    if (key.upArrow) setCursor(prev => Math.max(0, prev - 1));
    if (key.downArrow) setCursor(prev => Math.min(entries.length - 1, prev + 1));
    if (input === "/") setMode("search");
  });

  return (
    <Box flexDirection="column" padding={1} width={70} backgroundColor={COLORS.bgPanel}
      borderStyle="round" borderColor={COLORS.border}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>Memory Browser</Text>
        <Text color={COLORS.textMuted}>  {entries.length} entries</Text>
      </Box>
      {mode === "search" && (
        <Box marginBottom={1}>
          <Text color={COLORS.accent}>Search: </Text>
          <Text color={COLORS.text}>{searchQuery || <Text color={COLORS.textMuted}>Type query...</Text>}</Text>
        </Box>
      )}
      {entries.length === 0 ? (
        <Text color={COLORS.textMuted}>No memories yet</Text>
      ) : entries.map((e, i) => (
        <Box key={i} backgroundColor={i === cursor ? COLORS.bgHover : undefined}>
          <Text color={i === cursor ? COLORS.primary : COLORS.textMuted}>{i === cursor ? "\u203A " : "  "}</Text>
          <Text color={COLORS.text}>{e.content.slice(0, 80)}{e.content.length > 80 ? "..." : ""}</Text>
        </Box>
      ))}
    </Box>
  );
}
