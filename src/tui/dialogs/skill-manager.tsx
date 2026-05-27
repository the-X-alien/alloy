import React, { useState } from "react";
import { Text, Box, useInput } from "ink";
import { COLORS } from "../theme.js";
import type { SkillMeta } from "../../skill/types.js";

interface SkillManagerDialogProps {
  skills: SkillMeta[];
  onCreate: (name: string, description: string, prompt: string) => void;
  onToggle: (name: string) => void;
  onClose: () => void;
}

export function SkillManagerDialog({ skills, onCreate, onToggle, onClose }: SkillManagerDialogProps) {
  const [cursor, setCursor] = useState(0);
  const [tab, setTab] = useState<"list" | "create">("list");
  const [form, setForm] = useState({ name: "", description: "", prompt: "" });
  const [field, setField] = useState(0);

  const active = skills.filter(s => s.state === "active");
  const all = tab === "list" ? active : skills;

  useInput((input, key) => {
    if (key.escape) { onClose(); return; }

    if (tab === "create") {
      const fields = ["name", "description", "prompt"];
      if (key.tab || (key.ctrl && _input === "n")) {
        setField(prev => (prev + 1) % fields.length);
        return;
      }
      if (key.return && field === fields.length - 1) {
        onCreate(form.name, form.description, form.prompt);
        setTab("list");
        setForm({ name: "", description: "", prompt: "" });
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
    if (key.downArrow) setCursor(prev => Math.min(all.length - 1, prev + 1));
    if (key.return && all[cursor]) onToggle(all[cursor].name);
    if (input === "c") setTab("create");
  });

  return (
    <Box flexDirection="column" padding={1} width={70} backgroundColor={COLORS.bgPanel}
      borderStyle="round" borderColor={COLORS.border}>
      <Box marginBottom={1}>
        <Text bold color={COLORS.primary}>Skills</Text>
        <Text color={COLORS.textMuted}>  {active.length} active, {skills.length} total</Text>
      </Box>

      {tab === "list" ? (
        all.length === 0 ? (
          <Text color={COLORS.textMuted}>No skills found. Press 'c' to create one.</Text>
        ) : all.map((s, i) => (
          <Box key={s.name} backgroundColor={i === cursor ? COLORS.bgHover : undefined}>
            <Text color={i === cursor ? COLORS.primary : COLORS.textMuted}>{i === cursor ? "\u203A " : "  "}</Text>
            <Text color={s.state === "active" ? COLORS.text : COLORS.textDim}>{s.name}</Text>
            <Text color={COLORS.textMuted}>  {s.description}</Text>
            <Text color={COLORS.textDim}> [{s.source}]</Text>
          </Box>
        ))
      ) : (
        <Box flexDirection="column">
          <Text color={COLORS.accent}>{["Name:", "Description:", "Prompt:"][field]}</Text>
          <Text color={COLORS.text}>
            {[form.name, form.description, form.prompt][field] || <Text color={COLORS.textMuted}>Type here...</Text>}
          </Text>
          <Box marginTop={1}>
            <Text color={COLORS.textMuted}>Tab:next field  Enter:save  Esc:cancel</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

const _input = "";
