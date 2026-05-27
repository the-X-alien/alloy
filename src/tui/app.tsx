import React, { useState, useCallback, useEffect, useRef } from "react";
import { Text, Box, useInput } from "ink";
import { StatusBar } from "./status-bar.js";
import { Home } from "./home.js";
import { Session } from "./session.js";
import { COLORS } from "./theme.js";
import { Onboarding } from "./components/onboarding/index.js";
import { HelpDialog } from "./dialogs/help.js";
import { ModelPicker } from "./dialogs/model-picker.js";
import { ProviderConnect } from "./dialogs/provider-connect.js";
import { SettingsDialog } from "./dialogs/settings.js";
import { CommandPalette } from "./dialogs/command-palette.js";
import { SessionListDialog } from "./dialogs/session-list.js";
import { SkillManagerDialog } from "./dialogs/skill-manager.js";
import { ContextBankDialog } from "./dialogs/context-bank.js";
import { MemoryBrowserDialog } from "./dialogs/memory-browser.js";
import { PlanViewerDialog } from "./dialogs/plan-viewer.js";
import { getModels, getProviderConfig, getModelCost, getProviderConfigs } from "../providers/registry.js";
import type { ChatMessage, Provider } from "../providers/interface.js";
import { OpenAIProvider } from "../providers/openai.js";
import { AnthropicProvider } from "../providers/anthropic.js";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";
import { GoogleProvider } from "../providers/google.js";
import { LocalProvider } from "../providers/local.js";
import { OpenRouterProvider } from "../providers/openrouter.js";
import { BedrockProvider } from "../providers/bedrock.js";
import { SessionManager } from "../session/manager.js";
import { CostGovernor } from "../cost/governor.js";
import { parseCommand, getCommand, getAllCommands, type CommandContext } from "../commands/registry.js";
import { SkillManager } from "../skill/manager.js";
import { MemoryManager } from "../memory/manager.js";
import { ContextBankManager } from "../context-bank/manager.js";
import { ContextInjector } from "../context-bank/injector.js";
import { ModelRouter } from "../provider/router.js";
import { Orchestrator } from "../agent/orchestrator.js";
import { AgentRegistry } from "../agent/registry.js";
import { ToolRegistry } from "../agent/tool-registry.js";
import { ToolExecutor } from "../agent/tool-executor.js";
import { registerDefaultTools } from "../agent/tools/index.js";
import { CostTracker } from "../cost/tracker.js";
import type { ConfigLoader } from "../config/loader.js";
import type { MemoryEntry } from "../memory/types.js";
import type { ContextEntry } from "../context-bank/types.js";
import type { PlanArtifact } from "../agent/types.js";
import { uninstall } from "../uninstall.js";

const allModels = getModels();
const sessions = new SessionManager();
const governor = new CostGovernor(10.0);
const skills = new SkillManager();
const memoryManager = new MemoryManager();
const contextBankManager = new ContextBankManager();
const contextInjector = new ContextInjector(contextBankManager);
const toolRegistry = new ToolRegistry();
const toolExecutor = new ToolExecutor(toolRegistry, undefined, memoryManager);
const orchestrator = new Orchestrator();
const agentRegistry = new AgentRegistry(orchestrator);
const costTracker = new CostTracker();
const modelRouter = new ModelRouter();

registerDefaultTools(toolRegistry);

type Dialog = null | "help" | "model-picker" | "provider-connect" | "settings" | "command-palette"
  | "session-list" | "skill-manager" | "context-bank" | "memory-browser" | "plan-viewer";

function createProvider(providerId: string): Provider | undefined {
  const cfg = getProviderConfig(providerId);
  if (!cfg) return undefined;
  switch (providerId) {
    case "openai": return new OpenAIProvider(cfg);
    case "anthropic": return new AnthropicProvider(cfg);
    case "google": return new GoogleProvider(cfg);
    case "openrouter": return new OpenRouterProvider(cfg);
    case "amazon-bedrock": case "bedrock-mantle": return new BedrockProvider(cfg);
    case "ollama": case "lmstudio": case "vllm": case "sglang": case "inferrs": case "ds4":
      return new LocalProvider(cfg);
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

interface AppProps {
  configLoader?: ConfigLoader;
}

export function App({ configLoader }: AppProps) {
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
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  const [planArtifact, setPlanArtifact] = useState<PlanArtifact | null>(null);
  const [memoryEntries, setMemoryEntries] = useState<MemoryEntry[]>([]);
  const [contextEntries, setContextEntries] = useState<ContextEntry[]>(() => contextBankManager.getAll());
  const [suggestions, setSuggestions] = useState<{ visible: boolean; selected: number; items: { name: string; description: string }[] }>({ visible: false, selected: 0, items: [] });

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
    setCommandResult(null);
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

  const openDialog = useCallback((d: Dialog) => {
    setDialog(prev => prev === d ? null : d);
    if (d === "memory-browser") {
      setMemoryEntries(memoryManager.search("", 50));
    }
    if (d === "context-bank") {
      setContextEntries(contextBankManager.getAll());
    }
  }, []);

  const paletteCommands = [
    { id: "model.list", title: "Switch model", category: "Model", run: () => { setDialog("model-picker"); setCommandResult(null); } },
    { id: "provider.connect", title: "Connect provider", category: "Provider", run: () => { setDialog("provider-connect"); setCommandResult(null); } },
    { id: "session.new", title: "New session", category: "Session", run: () => { sessions.create(selected.model, selected.provider); setMessages([]); setCommandResult(null); setDialog(null); } },
    { id: "session.list", title: "Browse sessions", category: "Session", run: () => { setDialog("session-list"); setCommandResult(null); } },
    { id: "help.show", title: "Help", category: "System", run: () => { setDialog("help"); setCommandResult(null); } },
    { id: "settings.show", title: "Settings", category: "System", run: () => { setDialog("settings"); setCommandResult(null); } },
    { id: "app.exit", title: "Exit Alloy", category: "System", run: () => process.exit(0) },
    { id: "session.clear", title: "Clear messages", category: "Session", run: () => { setMessages([]); setCommandResult(null); setDialog(null); } },
    { id: "skills.show", title: "Manage skills", category: "Skills", run: () => { setDialog("skill-manager"); setCommandResult(null); } },
    { id: "context.show", title: "Manage context banks", category: "Context", run: () => { openDialog("context-bank"); setCommandResult(null); } },
    { id: "memory.show", title: "Browse memory", category: "Memory", run: () => { openDialog("memory-browser"); setCommandResult(null); } },
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
        case "new-session": sessions.create(selected.model, selected.provider); setMessages([]); break;
        case "exit": process.exit(0); break;
        case "uninstall": {
          const msgs = uninstall();
          setNotification(msgs.join("\n"));
          setTimeout(() => process.exit(0), 2000);
          break;
        }
      }
    }

    if (result.content) {
      if (result.type === "message" || result.type === "error") {
        setCommandResult(result.content);
      } else {
        setNotification(result.content);
      }
    }
  }, [selected, messages, providerInst, switchModel]);

  const handlePlanMode = useCallback(async (goal: string) => {
    setStreaming(true);
    setStreamContent("Planning...");

    try {
      const prov = providerInst ?? createProvider(selected.provider);
      if (!prov) {
        setStreamContent("No provider configured");
        setStreaming(false);
        return;
      }

      const result = await orchestrator.plan(
        goal,
        messages,
        { mode: "plan" as any, model: selected.model, provider: selected.provider },
        {
          provider: prov,
          memoryManager,
          skillManager: skills,
          contextInjector,
          costGovernor: governor,
          modelRouter,
          toolExecutor,
        },
      );

      if (result.plan) setPlanArtifact(result.plan);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: result.mergedOutput,
        model: `${selected.provider}/${selected.model}`,
        timestamp: Date.now(),
      }]);
    } catch (err: any) {
      setStreamContent(`Error: ${err?.message ?? "Unknown"}`);
    } finally {
      setStreaming(false);
    }
  }, [selected, providerInst, messages]);

  const handleSend = useCallback(async (text: string) => {
    if (text.startsWith("/plan ")) {
      await handlePlanMode(text.slice(6));
      return;
    }

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

      const routedModel = modelRouter.route(text, governor.getRemaining());

      for await (const token of prov.chat(allMsgs, { model: routedModel })) {
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
        model: `${selected.provider}/${routedModel}`,
        cost: cost > 0 ? cost : 0,
        timestamp: Date.now(),
      };

      if (cost > 0) sessions.update({ estimatedCost: (sessions.current?.estimatedCost ?? 0) + cost });
      setMessages(prev => [...prev, assistantMsg]);

      memoryManager.syncTurn(text, fullResponse);
    } catch (err: any) {
      setStreamContent(`Error: ${err?.message ?? "Unknown error"}`);
    } finally {
      setStreaming(false);
    }
  }, [messages, selected, providerInst, handlePlanMode]);

  const handleCommandRef = useRef(handleCommand);
  handleCommandRef.current = handleCommand;
  const handleSendRef = useRef(handleSend);
  handleSendRef.current = handleSend;

  const allCommandList = useRef(getAllCommands());

  const computeSuggestions = useCallback((text: string) => {
    if (!text.startsWith("/")) {
      setSuggestions({ visible: false, selected: 0, items: [] });
      return;
    }
    const query = text.slice(1).toLowerCase();
    const all = allCommandList.current;
    const filtered = all.filter(c => c.name.includes(query) || c.description.toLowerCase().includes(query));
    const items = filtered.slice(0, 12);
    setSuggestions(prev => ({
      visible: items.length > 0 && query.length > 0,
      selected: prev.selected >= items.length ? 0 : prev.selected,
      items,
    }));
  }, []);

  const completeFromSuggestions = useCallback(() => {
    if (!suggestions.visible || suggestions.items.length === 0) return;
    const selected = suggestions.items[suggestions.selected];
    if (selected) {
      setInput("/" + selected.name + " ");
      setSuggestions({ visible: false, selected: 0, items: [] });
    }
  }, [suggestions]);

  const submit = useCallback(() => {
    const text = inputRef.current.trim();
    if (!text) return;
    setInputHistory(prev => [text, ...prev].slice(0, 100));
    setHistoryIdx(-1);
    setInput("");
    setScrollOffset(0);
    setSuggestions({ visible: false, selected: 0, items: [] });

    if (text.startsWith("/")) {
      handleCommandRef.current(text);
    } else {
      handleSendRef.current(text);
    }
  }, []);

  useInput((_input, key) => {
    if (commandResult && !dialog) {
      setCommandResult(null);
      if (key.escape) return;
    }

    if (key.escape) {
      if (suggestions.visible) { setSuggestions({ visible: false, selected: 0, items: [] }); return; }
      if (dialog) { setDialog(null); return; }
      process.exit(0);
      return;
    }

    if (key.ctrl && _input.toLowerCase() === "k") { openDialog("command-palette"); return; }
    if (key.ctrl && _input.toLowerCase() === "m") { openDialog("model-picker"); return; }
    if (key.ctrl && _input.toLowerCase() === "p") { openDialog("provider-connect"); return; }
    if (_input === "," && key.ctrl) { openDialog("settings"); return; }
    if (key.ctrl && _input.toLowerCase() === "l") { openDialog("help"); return; }
    if (key.ctrl && _input.toLowerCase() === "s") { openDialog("session-list"); return; }

    if (key.ctrl && /^[1-9]$/.test(_input)) {
      const idx = parseInt(_input) - 1;
      const configured = getConfiguredProviders();
      if (idx < configured.length) {
        switchModel(configured[idx].modelId, configured[idx].providerId);
      }
      return;
    }

    if (key.pageUp || (key.ctrl && key.upArrow)) {
      setScrollOffset(prev => prev + 5);
      return;
    }
    if (key.pageDown || (key.ctrl && key.downArrow)) {
      setScrollOffset(prev => Math.max(0, prev - 5));
      return;
    }

    if (dialog) return;

    if (key.return) {
      if (key.shift) { setInput(prev => prev + "\n"); return; }
      if (suggestions.visible) { completeFromSuggestions(); return; }
      submit();
      return;
    }

    if (key.backspace || key.delete) {
      const next = inputRef.current.slice(0, -1);
      setInput(next);
      computeSuggestions(next);
      return;
    }

    if (key.upArrow) {
      if (suggestions.visible) {
        setSuggestions(prev => ({ ...prev, selected: Math.max(0, prev.selected - 1) }));
        return;
      }
      setHistoryIdx(prev => {
        const next = Math.min(prev + 1, inputHistory.length - 1);
        if (next >= 0 && next < inputHistory.length) setInput(inputHistory[next]);
        return next;
      });
      return;
    }

    if (key.downArrow) {
      if (suggestions.visible) {
        setSuggestions(prev => ({ ...prev, selected: Math.min(prev.items.length - 1, prev.selected + 1) }));
        return;
      }
      setHistoryIdx(prev => {
        const next = Math.max(prev - 1, -1);
        if (next === -1) setInput("");
        else if (next < inputHistory.length) setInput(inputHistory[next]);
        return next;
      });
      return;
    }

    if (key.tab) {
      if (suggestions.visible) { completeFromSuggestions(); return; }
      return;
    }

    if (_input >= " " && !key.ctrl && !key.meta) {
      const next = inputRef.current + _input;
      setInput(next);
      computeSuggestions(next);
      return;
    }
  });

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
    if (dialog === "session-list") return (
      <SessionListDialog
        sessions={sessions.all}
        currentSessionId={sessions.current?.id}
        onSelect={(id) => { sessions.switchTo(id); setMessages(sessions.getMessages()); setDialog(null); }}
        onClose={() => setDialog(null)}
        onDelete={(id) => { sessions.delete(id); if (sessions.current?.id === id) setMessages([]); }}
      />
    );
    if (dialog === "skill-manager") return (
      <SkillManagerDialog
        skills={skills.getAll()}
        onCreate={(name, desc, prompt) => { skills.create(name, desc, prompt); setNotification(`Created skill: ${name}`); setDialog(null); }}
        onToggle={(name) => { setNotification(`Toggled: ${name}`); }}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "context-bank") return (
      <ContextBankDialog
        entries={contextEntries}
        onSave={(entry) => { contextBankManager.save(entry); setContextEntries(contextBankManager.getAll()); setDialog(null); }}
        onDelete={(name) => { contextBankManager.delete(name); setContextEntries(contextBankManager.getAll()); }}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "memory-browser") return (
      <MemoryBrowserDialog
        entries={memoryEntries}
        onSearch={(query) => setMemoryEntries(memoryManager.search(query, 50))}
        onClose={() => setDialog(null)}
      />
    );
    if (dialog === "plan-viewer") return (
      <PlanViewerDialog
        plan={planArtifact}
        onClose={() => setDialog(null)}
      />
    );
    if (!hasMessages) return <Home input={input} />;
    return (
      <Session
        messages={messages}
        streaming={streaming}
        streamContent={streamContent}
        input={input}
        scrollOffset={scrollOffset}
        onScrollChange={setScrollOffset}
      />
    );
  })();

  return (
    <Box flexDirection="column" width="100%" height="100%" backgroundColor={COLORS.bg}>
      {notification && (
        <Box backgroundColor={COLORS.bgElement} paddingX={1} paddingY={0} flexShrink={0}>
          <Text color={COLORS.text}>{notification}</Text>
        </Box>
      )}
      {commandResult && !dialog && (
        <Box backgroundColor={COLORS.bgElement} paddingX={1} paddingY={0} flexShrink={0}>
          <Text color={COLORS.text}>{commandResult}</Text>
        </Box>
      )}
      <Box flexGrow={1} minHeight={0} flexDirection="column">
        {content}
      </Box>
      {suggestions.visible && suggestions.items.length > 0 && (
        <Box flexDirection="column" flexShrink={0} borderStyle="round" borderColor={COLORS.borderActive} backgroundColor={COLORS.bgPanel} marginLeft={1} marginRight={1}>
          {suggestions.items.map((cmd, i) => (
            <Box key={cmd.name} backgroundColor={i === suggestions.selected ? COLORS.bgElement : "transparent"}>
              <Text color={i === suggestions.selected ? COLORS.primary : COLORS.text}>
                {i === suggestions.selected ? "\u25B6 " : "  "}/<Text bold={i === suggestions.selected}>{cmd.name}</Text>
              </Text>
              <Text color={COLORS.textMuted}>  {cmd.description}</Text>
            </Box>
          ))}
          <Box>
            <Text color={COLORS.textDim}> Tab to complete | Esc to dismiss | Enter to run</Text>
          </Box>
        </Box>
      )}
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
