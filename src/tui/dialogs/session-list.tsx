import React, { useState, useEffect } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";
import type { SessionMeta } from "../../session/types.js";

interface SessionListDialogProps {
  sessions: SessionMeta[];
  currentSessionId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function SessionListDialog({ sessions, currentSessionId, onSelect, onClose, onDelete }: SessionListDialogProps) {
  const [cursor, setCursor] = useState(0);
  const [search, setSearch] = useState("");
  const [mode, setMode] = useState<"browse" | "search">("browse");

  const filtered = search
    ? sessions.filter(s => s.title.toLowerCase().includes(search.toLowerCase()))
    : sessions;

  useInput((input, key) => {
    if (key.escape) { onClose(); return; }
    if (key.return && filtered.length > 0) {
      onSelect(filtered[cursor].id);
      onClose();
      return;
    }
    if (key.delete && filtered.length > 0) {
      onDelete(filtered[cursor].id);
      return;
    }

    if (mode === "search") {
      if (key.return) { setMode("browse"); return; }
      if (key.backspace) { setSearch(prev => prev.slice(0, -1)); return; }
      if (input >= " " && !key.ctrl) { setSearch(prev => prev + input); return; }
      return;
    }

    if (key.upArrow) setCursor(prev => Math.max(0, prev - 1));
    if (key.downArrow) setCursor(prev => Math.min(filtered.length - 1, prev + 1));
    if (input === "/") setMode("search");
  });

  return (
    <Box flexDirection="column" padding={1} width={60} backgroundColor={COLORS.bgPanel}
      borderStyle="round" borderColor={COLORS.border}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>Sessions</Text>
        <Text color={COLORS.textMuted}>  {sessions.length} total</Text>
      </Box>
      {mode === "search" && (
        <Box marginBottom={1}>
          <Text color={COLORS.accent}>Search: </Text>
          <Text color={COLORS.text}>{search || <Text color={COLORS.textMuted}>Type to search...</Text>}</Text>
        </Box>
      )}
      {filtered.length === 0 ? (
        <Text color={COLORS.textMuted}>No sessions found</Text>
      ) : (
        filtered.map((s, i) => (
          <Box key={s.id} backgroundColor={i === cursor ? COLORS.bgHover : undefined}>
            <Text color={i === cursor ? COLORS.primary : COLORS.textMuted}>{i === cursor ? "\u203A " : "  "}</Text>
            <Text color={s.id === currentSessionId ? COLORS.primary : COLORS.text}>
              {s.title || "Untitled"}
            </Text>
            <Text color={COLORS.textDim}>  ({s.messageCount} msgs, ${s.estimatedCost.toFixed(4)})</Text>
          </Box>
        ))
      )}
      <Box marginTop={1}>
        <Text color={COLORS.textMuted}>/{"/search Del:delete Enter:select Esc:close"}</Text>
      </Box>
    </Box>
  );
}
