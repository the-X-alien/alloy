import React, { useState, useRef, useCallback, useEffect } from "react";
import { Text, Box, useInput, useApp } from "ink";
import { COLORS, providerColor, MiniLogo } from "./theme.js";
import type { ChatMessage } from "../providers/interface.js";
import type { ModelEntry } from "../providers/registry.js";

interface ChatProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  streaming: boolean;
  streamContent: string;
  models: ModelEntry[];
  currentModel: string;
  currentProvider: string;
  onModelChange: (model: string, provider: string) => void;
  onCommand?: (command: string) => void;
}

export function Chat({ messages, onSend, streaming, streamContent, models, currentModel, currentProvider, onModelChange, onCommand }: ChatProps) {
  const { exit } = useApp();
  const [input, setInput] = useState("");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [typingDots, setTypingDots] = useState(0);
  const inputRef = useRef(input);
  inputRef.current = input;

  const provider = providerColor(currentProvider);

  useEffect(() => {
    if (streaming) {
      const timer = setInterval(() => {
        setTypingDots(d => (d + 1) % 4);
      }, 400);
      return () => clearInterval(timer);
    }
    setTypingDots(0);
  }, [streaming]);

  useInput((_input, key) => {
    if (key.escape) {
      if (showHelp) { setShowHelp(false); return; }
      exit();
      return;
    }

    if (_input === "/" && input.length === 0) {
      setInput("/");
      return;
    }

    if (key.ctrl && /^[1-9]$/.test(_input)) {
      const idx = parseInt(_input) - 1;
      const available = models.filter(m => {
        const pColor = providerColor(m.provider);
        return pColor !== COLORS.textDim;
      });
      if (idx < available.length) {
        onModelChange(available[idx].model, available[idx].provider);
      }
      return;
    }

    if (key.ctrl && _input.toLowerCase() === "l") {
      setShowHelp(!showHelp);
      return;
    }

    if (key.return && !key.shift) {
      const text = input.trim();
      if (text.startsWith("/")) {
        onCommand?.(text);
        setInput("");
        return;
      }
      if (text) {
        onSend(text);
        setInput("");
      }
      return;
    }

    if (key.return && key.shift) {
      setInput(prev => prev + "\n");
      return;
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      return;
    }

    if (key.upArrow) setScrollOffset(p => p + 1);
    if (key.downArrow) setScrollOffset(p => Math.max(0, p - 1));
    if (key.pageUp) setScrollOffset(p => p + 10);
    if (key.pageDown) setScrollOffset(p => Math.max(0, p - 10));
    if (key.home) setScrollOffset(9999);
    if (key.end) setScrollOffset(0);

    if (!key.ctrl && !key.meta && !key.shift && _input.length === 1 && _input >= " ") {
      setInput(prev => prev + _input);
    }
  });

  const MAX_VISIBLE = 10;
  const allItems = [
    ...messages.map(m => ({ type: "msg" as const, msg: m })),
    ...(streaming ? [{ type: "stream" as const, content: streamContent }] : []),
  ];
  const truncated = allItems.slice(-MAX_VISIBLE - scrollOffset, allItems.length - scrollOffset);

  if (showHelp) {
    return (
      <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
        <Text bold color={COLORS.accent}>{"Alloy Help"}</Text>
        <Text color={COLORS.textDim}>{"─".repeat(40)}</Text>
        <Text color={COLORS.textBright}>{"Commands:"}</Text>
        <Text color={COLORS.text}>{"  /help         Show this help"}</Text>
        <Text color={COLORS.text}>{"  /model <name> Switch model"}</Text>
        <Text color={COLORS.text}>{"  /provider <n>  Switch provider"}</Text>
        <Text color={COLORS.text}>{"  /clear        Clear conversation"}</Text>
        <Text color={COLORS.text}>{"  /new          New session"}</Text>
        <Text color={COLORS.text}>{"  /status       Show session status"}</Text>
        <Text color={COLORS.text}>{"  /exit         Quit Alloy"}</Text>
        <Text color={COLORS.text}>{"  /uninstall    Remove Alloy"}</Text>
        <Text color={COLORS.textDim}>{"─".repeat(40)}</Text>
        <Text color={COLORS.textDim}>{"Keys: Ctrl+L help | Ctrl+1-9 model | Esc quit"}</Text>
        <Text color={COLORS.accent}>{"Press Esc to close"}</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box borderStyle="round" borderColor={COLORS.border} paddingX={1} flexGrow={1} flexDirection="column">
        {messages.length === 0 && !streaming ? (
          <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
            <Text bold color={COLORS.accentBright} fontSize={16}>{"\u2728 Alloy Ready"}</Text>
            <Text color={COLORS.textDim}>{"Multi-model AI coding agent"}</Text>
            <Text>{" "}</Text>
            <Text bold color={COLORS.textDim}>{"Active Models:"}</Text>
            {models.filter(m => {
              try { return providerColor(m.provider) !== COLORS.textDim; }
              catch { return false; }
            }).slice(0, 8).map((m, i) => {
              const isActive = m.model === currentModel && m.provider === currentProvider;
              const pColor = providerColor(m.provider);
              return (
                <Box key={`${m.provider}-${m.model}`}>
                  <Text color={isActive ? pColor : COLORS.textDim}>
                    {`  ${isActive ? "\u25C9" : " "} Ctrl+${i + 1} `}
                    <Text color={pColor}>{m.provider}</Text>
                    <Text color={COLORS.textDim}>/{m.model}</Text>
                    {isActive ? <Text color={COLORS.success}>{" (active)"}</Text> : null}
                  </Text>
                </Box>
              );
            })}
            <Text>{" "}</Text>
            <Text color={COLORS.textDim}>{"Ctrl+L help | Ctrl+1-9 model | Type a message"}</Text>
          </Box>
        ) : (
          <Box flexDirection="column" flexGrow={1}>
            {truncated.map((item, i) =>
              item.type === "msg" ? (
                <Box key={`msg-${i}`} flexDirection="column" marginY={0}>
                  <Box>
                    <Text bold color={item.msg.role === "user" ? COLORS.success : provider}>
                      {item.msg.role === "user" ? "\u25C9 You" : "\u25C9 Alloy"}
                    </Text>
                    {item.msg.model && (
                      <Text color={COLORS.textDim}>{" "}
                        <Text color={providerColor(item.msg.model.split("/")[0] ?? "")}>{item.msg.model}</Text>
                      </Text>
                    )}
                    {item.msg.cost && item.msg.cost > 0 ? (
                      <Text color={COLORS.textDim}>{` [$${item.msg.cost.toFixed(6)}]`}</Text>
                    ) : null}
                  </Box>
                  <Box marginLeft={1} marginTop={0}>
                    <Text color={COLORS.text}>{item.msg.content.slice(0, 3000)}</Text>
                  </Box>
                  <Box height={1} />
                </Box>
              ) : (
                <Box key="streaming" flexDirection="column" marginY={0}>
                  <Box>
                    <Text bold color={provider}>
                      {"\u25CF Alloy"}
                    </Text>
                    <Text color={COLORS.textDim}>
                      {" generating" + ".".repeat(typingDots) + " ".repeat(3 - typingDots)}
                    </Text>
                  </Box>
                  <Box marginLeft={1} marginTop={0}>
                    <Text color={COLORS.text}>{item.content.slice(0, 3000)}</Text>
                  </Box>
                </Box>
              )
            )}
          </Box>
        )}
      </Box>

      <Box borderStyle="single" borderColor={streaming ? COLORS.warning : input.startsWith("/") ? COLORS.accent : COLORS.border} paddingX={1} height={3} flexDirection="column">
        <Box>
          <Text color={input.startsWith("/") ? COLORS.accent : COLORS.success}>
            {input.startsWith("/") ? " / " : " > "}
          </Text>
          <Text color={streaming ? COLORS.textDim : COLORS.text}>
            {streaming ? "Awaiting response..." : (
              input || <Text color={COLORS.textDim}>{"Type /help for commands..."}</Text>
            )}
          </Text>
          {!streaming && input.length === 0 && (
            <Text color={COLORS.accent}>{"\u258C"}</Text>
          )}
        </Box>
        {input.length > 0 && !streaming ? (
          <Box>
            <Text color={COLORS.textDim}>{input.slice(0, 100)}{input.length > 100 ? "..." : ""}</Text>
          </Box>
        ) : streaming ? (
          <Box>
            <Text color={COLORS.warningDim}>{"\u25CF Generating..."}</Text>
            <Text color={COLORS.textDim}>{` ${(streamContent.length / 4).toFixed(0)} tokens`}</Text>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
