import React, { useState, useCallback, useEffect, useRef } from "react";
import { Text, Box, useInput } from "ink";
import { StatusBar } from "./status-bar.js";
import { Home } from "./home.js";
import { Session } from "./session.js";
import { COLORS } from "./theme.js";
import { Onboarding } from "./onboarding/index.js";
import { HelpDialog } from "./dialogs/help.js";
import { ModelPicker } from "./dialogs/model-picker.js";
import { ProviderConnect } from "./dialogs/provider-connect.js";
import { SettingsDialog } from "./dialogs/settings.js";
import { CommandPalette } from "./dialogs/command-palette.js";
import { getModels, getProviderConfig, getModelCost, getProviderConfigs } from "../providers/registry.js";
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
import { uninstall } from "../uninstall.js";

const allModels = getModels();
const sessions = new SessionManager();
const governor = new CostGovernor(10.0);
const skills = new SkillManager();

type Dialog = null | "help" | "model-picker" | "provider-connect" | "settings" | "command-palette";

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

export function App() {
  const [onboarded, setOnboarded] = useState(() => {
    const configured = getConfiguredProviders();
    return configured.length > 0;
  });
  const [input, setInput] = useState("");
  const [inputHistory, setInputHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [selected, setSelected] = useState(() => findAvailableModel());
  const [providerInst, setProviderInst] = useState<Provider | undefined>(() => createProvider(selected.provider));
  const [notification, setNotification] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);

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
    setDialog(null);
  }, []);

  const configureProvider = useCallback((providerId: string, apiKey: string) => {
    const cfg = getProviderConfig(providerId);
    if (cfg) {
      process.env[cfg.apiKeyEnv] = apiKey;
    }
    const p = createProvider(providerId);
    if (p?.configured) {
      const m = allModels.find(m => m.provider === providerId);
      if (m) switchModel(m.model, m.provider);
    }
    setNotification(`Configured ${providerId}`);
    setDialog(null);
  }, [switchModel]);

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

  const openDialog = useCallback((d: Dialog) => {
    setDialog(prev => prev === d ? null : d);
  }, []);

  useInput((_input, key) => {
    if (key.escape) {
      if (dialog) { setDialog(null); return; }
      process.exit(0);
      return;
    }

    if (key.ctrl && _input.toLowerCase() === "k") { openDialog("command-palette"); return; }
    if (key.ctrl && _input.toLowerCase() === "m") { openDialog("model-picker"); return; }
    if (key.ctrl && _input.toLowerCase() === "p") { openDialog("provider-connect"); return; }
    if (_input === "," && key.ctrl) { openDialog("settings"); return; }
    if (key.ctrl && _input.toLowerCase() === "l") { openDialog("help"); return; }

    if (key.ctrl && /^[1-9]$/.test(_input)) {
      const idx = parseInt(_input) - 1;
      const configured = getConfiguredProviders();
      if (idx < configured.length) {
        switchModel(configured[idx].modelId, configured[idx].providerId);
      }
      return;
    }

    if (dialog) return;

    if (key.return) {
      if (key.shift) { setInput(prev => prev + "\n"); return; }
      submit();
      return;
    }

    if (key.backspace || key.delete) { setInput(prev => prev.slice(0, -1)); return; }

    if (key.upArrow) {
      setHistoryIdx(prev => {
        const next = Math.min(prev + 1, inputHistory.length - 1);
        if (next >= 0 && next < inputHistory.length) setInput(inputHistory[next]);
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

    if (_input && !key.ctrl && !key.meta) { setInput(prev => prev + _input); return; }
  });

  const paletteCommands = [
    { id: "model.list", title: "Switch model", category: "Model", run: () => { setDialog("model-picker"); } },
    { id: "provider.connect", title: "Connect provider", category: "Provider", run: () => { setDialog("provider-connect"); } },
    { id: "session.new", title: "New session", category: "Session", run: () => { sessions.create(); setMessages([]); setDialog(null); } },
    { id: "help.show", title: "Help", category: "System", run: () => { setDialog("help"); } },
    { id: "settings.show", title: "Settings", category: "System", run: () => { setDialog("settings"); } },
    { id: "app.exit", title: "Exit Alloy", category: "System", run: () => process.exit(0) },
    { id: "session.clear", title: "Clear messages", category: "Session", run: () => { setMessages([]); setDialog(null); } },
  ];

  const handleCommand = useCallback(async (cmdText: string) => {
    const parsed = parseCommand(cmdText);
    if (!parsed) { setNotification(`Unknown command: ${cmdText}. Try /help`); return; }
    const cmd = getCommand(parsed.command);
    if (!cmd) { setNotification(`Unknown command: ${parsed.command}. Try /help`); return; }

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
        case "switch-model": {
          const m = allModels.find(m => m.model === result.action.payload);
          if (m) switchModel(m.model, m.provider);
          break;
        }
        case "switch-provider": {
          const m = allModels.find(m => m.provider === result.action.payload);
          if (m) switchModel(m.model, m.provider);
          break;
        }
        case "clear": setMessages([]); break;
        case "new-session": sessions.create(); setMessages([]); break;
        case "exit": process.exit(0); break;
        case "uninstall": {
          const msgs = uninstall();
          setNotification(msgs.join("\n"));
          setTimeout(() => process.exit(0), 2000);
          break;
        }
      }
    }

    if (result.content) setNotification(result.content);
  }, [selected, messages, providerInst, switchModel]);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setStreamContent("");

    const prov = providerInst ?? createProvider(selected.provider);
    if (!prov) {
      setStreamContent("No provider available. Use Ctrl+P to add one.");
      setStreaming(false);
      return;
    }

    if (!prov.configured) {
      const cfg = getProviderConfig(selected.provider);
      setStreamContent(`${prov.name} not configured. Use Ctrl+P to add API key.`);
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

  if (!onboarded) {
    return (
      <Onboarding
        onComplete={(keys) => {
          setOnboarded(true);
          if (Object.keys(keys).length > 0) {
            const configured = getConfiguredProviders();
            if (configured.length > 0) switchModel(configured[0].modelId, configured[0].providerId);
          }
        }}
      />
    );
  }

  const configured = getConfiguredProviders();
  const modelOptions = allModels.map(m => ({
    modelId: m.model,
    providerId: m.provider,
    configured: configured.some(c => c.providerId === m.provider),
  }));
  const providerOptions = getProviderConfigs().map(c => ({
    id: c.id,
    name: c.name,
    configured: configured.some(p => p.providerId === c.id),
    apiKeyEnv: c.apiKeyEnv,
  }));

  const content = (() => {
    if (dialog === "help") return <HelpDialog />;
    if (dialog === "model-picker") return (
      <ModelPicker
        models={modelOptions}
        currentModel={selected.model}
        currentProvider={selected.provider}
        onSelect={switchModel}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "provider-connect") return (
      <ProviderConnect
        providers={providerOptions}
        onConfigure={configureProvider}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "settings") return (
      <SettingsDialog
        provider={selected.provider}
        model={selected.model}
        messages={messages.length}
        spent={governor.getSpent()}
        budget={governor.getBudget()}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "command-palette") return (
      <CommandPalette
        commands={paletteCommands}
        onClose={() => setDialog(null)}
      />
    );
    if (!hasMessages) return <Home input={input} />;
    return <Session messages={messages} streaming={streaming} streamContent={streamContent} input={input} />;
  })();

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
