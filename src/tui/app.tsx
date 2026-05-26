import React, { useState, useCallback, useEffect, useRef } from "react";
import { Text, Box, useInput } from "ink";
import { StatusBar } from "./status-bar.js";
import { Home } from "./home.js";
import { Session } from "./session.js";
import { COLORS } from "./theme.js";
import { getModels, getProviderConfig, getModelCost } from "../providers/registry.js";
import type { ChatMessage, Provider } from "../providers/interface.js";
import { OpenAIProvider } from "../providers/openai.js";
import { AnthropicProvider } from "../providers/anthropic.js";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";
import { GoogleProvider } from "../providers/google.js";
import { LocalProvider } from "../providers/local.js";
import { OpenRouterProvider } from "../providers/openrouter.js";
import { SessionManager } from "../session/manager.js";
import { CostGovernor } from "../cost/governor.js";
import { parseCommand, getCommand, type CommandContext } from "../commands/registry.js";
import { SkillManager } from "../skills/manager.js";
import { detectTools, importAll, applyImport } from "../migrate/importer.js";
import { uninstall } from "../uninstall.js";

const allModels = getModels();
const sessions = new SessionManager();
const governor = new CostGovernor(10.0);
const skills = new SkillManager();

function createProvider(providerId: string): Provider | undefined {
  const cfg = getProviderConfig(providerId);
  if (!cfg) return undefined;
  switch (providerId) {
    case "openai": return new OpenAIProvider(cfg);
    case "anthropic": return new AnthropicProvider(cfg);
    case "google": return new GoogleProvider(cfg);
    case "openrouter": return new OpenRouterProvider(cfg);
    case "ollama": case "lmstudio": return new LocalProvider(cfg);
    default: return new OpenAICompatibleProvider(cfg);
  }
}

function findAvailableModel(): { model: string; provider: string } {
  for (const m of allModels) {
    const p = createProvider(m.provider);
    if (p?.configured) return { model: m.model, provider: m.provider };
  }
  return { model: "gpt-4o", provider: "openai" };
}

function getConfiguredProviders() {
  const result: { providerId: string; modelId: string }[] = [];
  for (const m of allModels) {
    const p = createProvider(m.provider);
    if (p?.configured) result.push({ providerId: m.provider, modelId: m.model });
  }
  return result;
}

function HelpDialog({ onClose }: { onClose: () => void }) {
  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor={COLORS.accent} padding={1}>
      <Text bold color={COLORS.accent}>{"Alloy Help"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text bold color={COLORS.textBright}>{"Slash Commands"}</Text>
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
      <Text color={COLORS.text}>{"  /import       Import configs from other tools"}</Text>
      <Text color={COLORS.text}>{"  /exit         Quit Alloy"}</Text>
      <Text color={COLORS.text}>{"  /uninstall    Remove Alloy"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text bold color={COLORS.textBright}>{"Keyboard Shortcuts"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+L        Toggle help"}</Text>
      <Text color={COLORS.text}>{"  Ctrl+1-9      Quick-switch model"}</Text>
      <Text color={COLORS.text}>{"  Escape        Quit"}</Text>
      <Text color={COLORS.textDim}>{"\u2500".repeat(48)}</Text>
      <Text color={COLORS.accent}>{"Press Escape to close"}</Text>
    </Box>
  );
}

export function App() {
  const [input, setInput] = useState("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [selected, setSelected] = useState(() => findAvailableModel());
  const [providerInst, setProviderInst] = useState<Provider | undefined>(() => createProvider(selected.provider));
  const [notification, setNotification] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const inputRef = useRef(input);
  inputRef.current = input;

  const hasMessages = messages.length > 0 || streaming;

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const switchModel = useCallback((model: string, providerId: string) => {
    setSelected({ model, provider: providerId });
    setProviderInst(createProvider(providerId));
  }, []);

  const submit = useCallback(() => {
    const text = inputRef.current.trim();
    if (!text) return;
    setInputHistory(prev => [text, ...prev].slice(0, 100));
    setHistoryIdx(-1);
    setInput("");

    if (text.startsWith("/")) {
      handleCommand(text);
    } else {
      handleSend(text);
    }
  }, []);

  useEffect(() => {
    if (!providerInst?.configured) {
      for (const m of allModels) {
        const p = createProvider(m.provider);
        if (p?.configured) {
          switchModel(m.model, m.provider);
          return;
        }
      }
    }
  }, []);

  useEffect(() => {
    const detected = detectTools();
    const found = detected.filter(d => d.detected);
    if (found.length > 0) {
      const results = importAll();
      let imported = 0;
      for (const r of results) {
        const msgs = applyImport(r);
        if (msgs.length > 0) imported += msgs.length;
      }
      if (imported > 0) {
        setNotification(`Imported keys from: ${found.map(f => f.tool).join(", ")}`);
        for (const m of allModels) {
          const p = createProvider(m.provider);
          if (p?.configured) {
            switchModel(m.model, m.provider);
            break;
          }
        }
      }
    }
  }, []);

  useInput((_input, key) => {
    if (key.escape) {
      if (showHelp) { setShowHelp(false); return; }
      process.exit(0);
      return;
    }

    if (key.ctrl && _input.toLowerCase() === "l") {
      setShowHelp(prev => !prev);
      return;
    }

    if (key.ctrl && /^[1-9]$/.test(_input)) {
      const idx = parseInt(_input) - 1;
      const configured = getConfiguredProviders();
      if (idx < configured.length) {
        switchModel(configured[idx].modelId, configured[idx].providerId);
      }
      return;
    }

    if (showHelp) return;

    if (key.return) {
      if (key.shift) {
        setInput(prev => prev + "\n");
        return;
      }
      submit();
      return;
    }

    if (key.backspace || key.delete) {
      setInput(prev => prev.slice(0, -1));
      return;
    }

    if (key.upArrow) {
      setHistoryIdx(prev => {
        const next = Math.min(prev + 1, inputHistory.length - 1);
        if (next >= 0 && next < inputHistory.length) {
          setInput(inputHistory[next]);
        }
        return next;
      });
      return;
    }

    if (key.downArrow) {
      setHistoryIdx(prev => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) setInput("");
        else if (next < inputHistory.length) setInput(inputHistory[next]);
        return next;
      });
      return;
    }

    if (_input && !key.ctrl && !key.meta) {
      setInput(prev => prev + _input);
      return;
    }
  });

  const handleCommand = useCallback(async (cmdText: string) => {
    const parsed = parseCommand(cmdText);
    if (!parsed) {
      setNotification(`Unknown command: ${cmdText}. Try /help`);
      return;
    }

    const cmd = getCommand(parsed.command);
    if (!cmd) {
      setNotification(`Unknown command: ${parsed.command}. Try /help`);
      return;
    }

    const ctx: CommandContext = {
      args: parsed.args,
      session: sessions.current,
      currentModel: selected.model,
      currentProvider: selected.provider,
      configuredProviders: getConfiguredProviders(),
      messages: messages.length,
      costSpent: governor.getSpent(),
      costBudget: governor.getBudget(),
    };

    const result = await cmd.handler(ctx);

    if (result.type === "action" && result.action) {
      switch (result.action.type) {
        case "switch-model":
          if (result.action.payload) {
            const m = allModels.find(m => m.model === result.action.payload);
            if (m) switchModel(m.model, m.provider);
          }
          break;
        case "switch-provider":
          if (result.action.payload) {
            const m = allModels.find(m => m.provider === result.action.payload);
            if (m) switchModel(m.model, m.provider);
          }
          break;
        case "clear":
          setMessages([]);
          break;
        case "new-session":
          sessions.create();
          setMessages([]);
          break;
        case "exit":
          process.exit(0);
          break;
        case "uninstall": {
          const msgs = uninstall();
          setNotification(msgs.join("\n"));
          setTimeout(() => process.exit(0), 2000);
          break;
        }
      }
    }

    if (result.content) {
      setNotification(result.content);
    }
  }, [selected, messages, providerInst]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamContent("");

    const prov = providerInst ?? createProvider(selected.provider);
    if (!prov) {
      setStreamContent("No provider available. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY");
      setStreaming(false);
      return;
    }

    if (!prov.configured) {
      const cfg = getProviderConfig(selected.provider);
      setStreamContent(`${prov.name} not configured. Set ${cfg?.apiKeyEnv ?? "${provider}_API_KEY"}`);
      setStreaming(false);
      return;
    }

    try {
      const allMsgs = [...messages, userMsg];
      let fullResponse = "";
      for await (const token of prov.chat(allMsgs, { model: selected.model })) {
        fullResponse += token;
        setStreamContent(fullResponse);
      }

      const inputTokens = Math.ceil(text.length / 4);
      const outputTokens = Math.ceil(fullResponse.length / 4);
      const costData = getModelCost(selected.provider, selected.model);
      let cost = -1;
      if (costData) {
        cost = governor.estimateAndRecord(
          selected.provider, selected.model, inputTokens, outputTokens,
          () => (inputTokens / 1_000_000 * costData.input) + (outputTokens / 1_000_000 * costData.output)
        );
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fullResponse,
        model: `${selected.provider}/${selected.model}`,
        cost: cost > 0 ? cost : 0,
        timestamp: Date.now(),
      };

      if (cost > 0) sessions.addCost(cost);
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setStreamContent(`Error: ${err?.message ?? "Unknown error"}`);
    } finally {
      setStreaming(false);
    }
  }, [messages, selected, providerInst]);

  const content = showHelp ? (
    <HelpDialog onClose={() => setShowHelp(false)} />
  ) : !hasMessages ? (
    <Home input={input} />
  ) : (
    <Session
      messages={messages}
      streaming={streaming}
      streamContent={streamContent}
      input={input}
    />
  );

  return (
    <Box flexDirection="column" width="100%" height="100%">
      {notification && (
        <Box borderStyle="round" borderColor={COLORS.accent} paddingX={1} flexShrink={0}>
          <Text color={COLORS.textBright}>{notification}</Text>
        </Box>
      )}
      <Box flexGrow={1} minHeight={0} flexDirection="column">
        {content}
      </Box>
      <Box flexShrink={0}>
        <StatusBar
          session={sessions.current}
          provider={selected.provider}
          model={selected.model}
          spent={governor.getSpent()}
          budget={governor.getBudget()}
          messages={messages.length}
        />
      </Box>
    </Box>
  );
}
