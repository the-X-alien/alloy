import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";
import type { ContextEntry } from "../../context-bank/types.js";

interface ContextBankDialogProps {
  entries: ContextEntry[];
  onSave: (entry: Omit<ContextEntry, "id" | "createdAt" | "usageCount">) => void;
  onDelete: (name: string) => void;
  onClose: () => void;
}

export function ContextBankDialog({ entries, onSave, onDelete, onClose }: ContextBankDialogProps) {
  const [cursor, setCursor] = useState(0);
  const [tab, setTab] = useState<"list" | "create">("list");
  const [form, setForm] = useState({ name: "", content: "", tags: "", triggerPattern: "" });
  const [field, setField] = useState(0);

  useInput((input, key) => {
    if (key.escape) { onClose(); return; }

    if (tab === "create") {
      const fields = ["name", "content", "tags", "triggerPattern"];
      if (key.tab || (key.ctrl && _input === "n")) {
        setField(prev => (prev + 1) % fields.length);
        return;
      }
      if (key.return && field === fields.length - 1) {
        onSave({
          name: form.name,
          content: form.content,
          tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
          triggerPattern: form.triggerPattern || undefined,
        });
        setTab("list");
        setForm({ name: "", content: "", tags: "", triggerPattern: "" });
        return;
      }
      if (key.backspace) {
        setForm(prev => ({ ...prev, [fields[field]]: (prev as any)[fields[field]].slice(0, -1) }));
        return;
      }
      if (input >= " " && !key.ctrl) {
        setForm(prev => ({ ...prev, [fields[field]]: (prev as any)[fields[field]] + input }));
      }
      return;
    }

    if (key.upArrow) setCursor(prev => Math.max(0, prev - 1));
    if (key.downArrow) setCursor(prev => Math.min(entries.length - 1, prev + 1));
    if (key.delete && entries[cursor]) onDelete(entries[cursor].name);
    if (input === "c") setTab("create");
  });

  return (
    <Box flexDirection="column" padding={1} width={70} backgroundColor={COLORS.bgPanel}
      borderStyle="round" borderColor={COLORS.border}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>Context Banks</Text>
        <Text color={COLORS.textMuted}>  {entries.length} saved</Text>
      </Box>
      {tab === "create" ? (
        <Box flexDirection="column">
          <Text color={COLORS.accent}>{["Name:", "Content:", "Tags (comma):", "Trigger pattern:"][field]}</Text>
          <Text color={COLORS.text}>
            {[form.name, form.content, form.tags, form.triggerPattern][field] || <Text color={COLORS.textMuted}>Type here...</Text>}
          </Text>
          <Text color={COLORS.textMuted}>Tab:next  Enter:save  Esc:cancel</Text>
        </Box>
      ) : entries.length === 0 ? (
        <Box>
          <Text color={COLORS.textMuted}>No context banks. Press 'c' to create.</Text>
        </Box>
      ) : (
        entries.map((e, i) => (
          <Box key={e.name} backgroundColor={i === cursor ? COLORS.bgHover : undefined}>
            <Text color={i === cursor ? COLORS.primary : COLORS.textMuted}>{i === cursor ? "\u203A " : "  "}</Text>
            <Text color={COLORS.text}>{e.name}</Text>
            <Text color={COLORS.textDim}>  [{e.tags?.join(", ")}]</Text>
          </Box>
        ))
      )}
    </Box>
  );
}

const _input = "";
