import React from "react";
import { Text, Box } from "ink";
import { COLORS } from "../theme.js";

export function HelpDialog() {
  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Text bold color={COLORS.accent}>{"Alloy Help"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text bold color={COLORS.text}>{"Slash Commands"}</Text>
      <Text color={COLORS.text}>{"  /help         Show this help"}</Text>
      <Text color={COLORS.text}>{"  /models       List available models"}</Text>
      <Text color={COLORS.text}>{"  /providers    List configured providers"}</Text>
      <Text color={COLORS.text}>{"  /model <name> Switch model"}</Text>
      <Text color={COLORS.text}>{"  /provider <n>  Switch provider"}</Text>
      <Text color={COLORS.text}>{"  /clear        Clear conversation"}</Text>
      <Text color={COLORS.text}>{"  /new          New session"}</Text>
      <Text color={COLORS.text}>{"  /sessions     List sessions"}</Text>
      <Text color={COLORS.text}>{"  /status       Show session status"}</Text>
      <Text color={COLORS.text}>{"  /skills       List loaded skills"}</Text>
      <Text color={COLORS.text}>{"  /compact      Compact session context"}</Text>
      <Text color={COLORS.text}>{"  /copy         Copy last response"}</Text>
      <Text color={COLORS.text}>{"  /version      Show version"}</Text>
      <Text color={COLORS.text}>{"  /connect      Add provider"}</Text>
      <Text color={COLORS.text}>{"  /exit         Quit Alloy"}</Text>
      <Text color={COLORS.text}>{"  /uninstall    Remove Alloy"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text bold color={COLORS.text}>{"Keyboard Shortcuts"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+K        Command palette"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+M        Switch model"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+P        Connect provider"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+,        Settings"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+L        Toggle help"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+1-9      Quick-switch model"}</Text>
      <Text color={COLORS.text}>{"  Tab/Shift+Tab Cycle agents"}</Text>
      <Text color={COLORS.text}>{"  Escape        Close dialog / Quit"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.accent}>{"Press Escape to close"}</Text>
    </Box>
  );
}
