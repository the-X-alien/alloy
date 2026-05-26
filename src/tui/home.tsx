import React from "react";
import { Text, Box } from "ink";
import { Logo, COLORS } from "./theme.js";
import { PromptDisplay } from "./prompt.js";

interface HomeProps {
  input: string;
}

export function Home({ input }: HomeProps) {
  return (
    <Box flexDirection="column" flexGrow={1} alignItems="center" justifyContent="center" padding={1}>
      <Box flexGrow={1} flexDirection="column" alignItems="center" justifyContent="center">
        <Logo />
        <Box height={1} />
        <Text color={COLORS.textDim}>{"Ask anything, or type /help for commands"}</Text>
      </Box>
      <Box flexShrink={0} width="100%">
        <PromptDisplay input={input} streaming={false} placeholder="Ask anything..." />
      </Box>
    </Box>
  );
}
