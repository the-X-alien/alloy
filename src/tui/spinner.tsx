import React, { useEffect, useState } from "react";
import { Text } from "ink";
import { COLORS } from "./theme.js";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export function Spinner({ color = COLORS.accent }: { color?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFrame(prev => (prev + 1) % FRAMES.length), 80);
    return () => clearInterval(t);
  }, []);

  return <Text color={color}>{FRAMES[frame]}</Text>;
}
