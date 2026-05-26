import React, { useState, useCallback, useEffect } from "react";
import { Text, Box } from "ink";
import { StatusBar } from "./status-bar.js";
import { Chat } from "./chat.js";
import { Logo, COLORS, providerColor } from "./theme.js";
import { getModels, getProviderConfig, getModelCost } from "../providers/registry.js";
import type { ChatMessage, Provider } from "../providers/interface.js";
import { OpenAIProvider } from "../providers/openai.js";
import { AnthropicProvider } from "../providers/anthropic.js";
import { OpenAICompatibleProvider } from "../providers/openai-compatible.js";
import { GoogleProvider } from "../providers/google.js";
import { LocalProvider } from "../providers/local.js";
import { SessionManager } from "../session/manager.js";
import { CostGovernor } from "../cost/governor.js";
import { parseCommand, getCommand, type CommandContext } from "../commands/registry.js";
import { SkillManager } from "../skills/manager.js";
import { detectTools, importFrom, importAll, applyImport } from "../migrate/importer.js";
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
  const [selected, setSelected] = useState(() => findAvailableModel());
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState("");
  const [providerInst, setProviderInst] = useState<Provider | undefined>(() => createProvider(selected.provider));
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  const switchModel = useCallback((model: string, providerId: string) => {
    setSelected({ model, provider: providerId });
    setProviderInst(createProvider(providerId));
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

  // Auto-import from detected tools on first launch
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
        // Re-evaluate configured providers
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

  const handleCommand = useCallback(async (cmdText: string) => {
    const parsed = parseCommand(cmdText);
    if (!parsed) {
      setNotification(`Unknown command: ${cmdText}`);
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
        case "uninstall":
          const msgs = uninstall();
          setNotification(msgs.join("\n"));
          setTimeout(() => process.exit(0), 2000);
          break;
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
      const hint = cfg?.apiKeyHint ?? `${cfg?.apiKeyEnv ?? "API key"}`;
      setStreamContent(`${prov.name} not configured.\nSet ${cfg?.apiKeyEnv ?? "${provider}_API_KEY"} (${hint})`);
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

  const current = sessions.current;
  const configuredCount = getConfiguredProviders().length;
  const configured = getConfiguredProviders();

  return (
    <Box flexDirection="column" width="100%" height="100%">
      <Box justifyContent="space-between" paddingX={1} paddingY={0}>
        <Box flexDirection="column">
          <Logo />
        </Box>
        <Box flexDirection="column" alignItems="flex-end" gap={0}>
          <Text color={configuredCount > 0 ? COLORS.success : COLORS.warning}>
            {configuredCount > 0 ? `${configuredCount} models \u2713` : "No API keys found"}
          </Text>
          <Text color={COLORS.textDim}>
            {"Ctrl+L help | Esc quit"}
          </Text>
        </Box>
      </Box>

      {notification && (
        <Box borderStyle="round" borderColor={COLORS.accent} paddingX={1} marginY={0}>
          <Text color={COLORS.textBright}>{notification}</Text>
        </Box>
      )}

      <Chat
        messages={messages}
        onSend={handleSend}
        streaming={streaming}
        streamContent={streamContent}
        models={allModels}
        currentModel={selected.model}
        currentProvider={selected.provider}
        onModelChange={switchModel}
        onCommand={handleCommand}
      />

      <StatusBar
        session={current}
        provider={selected.provider}
        model={selected.model}
        spent={governor.getSpent()}
        budget={governor.getBudget()}
        messages={messages.length}
      />
    </Box>
  );
}
