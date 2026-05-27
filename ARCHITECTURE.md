# Alloy Architecture

## File Tree (110 files)

```
src/
├── index.ts                          # Entry: boots Ink, mounts App
├── cli.tsx                           # Argparse: --model, --continue, --plan, --import
├── types.ts                          # Global shared types
│
├── agent/                            # Agent system (10 files)
│   ├── types.ts                      # AgentConfig, AgentResult, PlanArtifact
│   ├── registry.ts                   # Agent factory: mode → agent class
│   ├── chat.ts                       # ChatAgent: default single-turn
│   ├── plan.ts                       # PlanAgent: produces plan artifacts
│   ├── build.ts                      # BuildAgent: executes plan steps
│   ├── orchestrator.ts               # Plan→Build: splits work, spawns sub-agents
│   ├── conversation-loop.ts          # Core loop: messages→LLM→tools→LLM
│   ├── system-prompt.ts              # Skills + memory + context banks injection
│   ├── tool-executor.ts              # Tool dispatch with plugin hooks
│   ├── tool-registry.ts              # Tool definitions registry
│   ├── review.ts                     # Post-turn memory/skill review
│   └── tools/index.ts                # 6 default tools (read, write, bash, glob, grep, list)
│
├── session/                          # Session system (6 files)
│   ├── types.ts                      # SessionMeta, SessionStatus
│   ├── manager.ts                    # Facade over SQLite store
│   ├── store.ts                      # SQLite CRUD (WAL mode)
│   ├── search.ts                     # FTS5 full-text search
│   ├── snapshot.ts                   # Git context snapshots
│   └── compression.ts                # Context compression
│
├── memory/                           # Memory system (6 files)
│   ├── types.ts                      # MemoryEntry, MemoryProviderConfig
│   ├── provider.ts                   # MemoryProvider interface
│   ├── manager.ts                    # Orchestrates builtin + external provider
│   ├── builtin.ts                    # JSONL-file provider with keyword search
│   ├── sqlite.ts                     # SQLite provider with FTS5 search
│   └── search.ts                     # Scoring: keyword + recency + relevance
│
├── skill/                            # Skill system (6 files)
│   ├── types.ts                      # SkillMeta, SkillSource, SkillState
│   ├── manager.ts                    # Facade: discover, get, search, create, curate
│   ├── loader.ts                     # SKILL.md frontmatter parser
│   ├── registry.ts                   # Keyed registry with search
│   ├── creator.ts                    # LLM generates SKILL.md from experience
│   └── curator.ts                    # Auto-archive stale agent-created skills
│
├── context-bank/                     # Context bank system (3 files)
│   ├── types.ts                      # ContextEntry
│   ├── manager.ts                    # CRUD with JSON persistence
│   └── injector.ts                   # Regex + tag matching → auto-inject
│
├── plugin/                           # Plugin system (6 files)
│   ├── types.ts                      # PluginHooks, PluginModule, PluginMeta
│   ├── registry.ts                   # Discover from ~/.alloy/plugins/
│   ├── loader.ts                     # Resolve from local/npm
│   ├── hooks.ts                      # Ordered hook firing
│   ├── runtime.ts                    # Init, activate, deactivate lifecycle
│   └── mcp-adapter.ts                # MCP servers as plugin tools
│
├── provider/                         # Model router (1 file)
│   └── router.ts                     # Complexity classification → cheapest model
│
├── providers/                        # Provider implementations (8 files)
│   ├── interface.ts                  # Provider, ChatMessage, ChatOptions
│   ├── registry.ts                   # 16 providers, ~50 models with costs
│   ├── openai.ts, anthropic.ts, google.ts, etc.
│
├── command/                          # New built-in commands (4 files)
│   ├── handler.ts                    # CommandHandler type
│   └── builtin/
│       ├── plan.ts, memory.ts, context.ts
│
├── commands/registry.ts              # Original 18-slot command registry
├── cost/                             # Cost system (3 files)
│   ├── governor.ts                   # Budget tracking + warnings
│   ├── tracker.ts                    # Per-model/per-session breakdowns
│   └── estimator.ts                  # Token→cost from catalog
│
├── config/                           # Config system (4 files)
│   ├── schema.ts                     # Full AlloyConfig interface
│   ├── defaults.ts                   # Default values
│   ├── loader.ts                     # JSON + env + CLI overlay
│   └── migrate.ts                    # Schema version migration
│
├── migrate/                          # Import/Export (2 files)
│   ├── importer.ts                   # Claude/OpenCode/OpenClaw/Cursor
│   └── exporter.ts                   # Profile export as shareable JSON
│
├── db/                               # Database (3 files)
│   ├── schema.ts                     # 7 tables + 2 FTS5 + indexes
│   ├── connection.ts                 # SQLite singleton with WAL mode
│   └── migrations.ts                 # Version-based migration runner
│
├── util/                             # Utilities (6 files)
│   ├── fs.ts, git.ts, format.ts, clipboard.ts, editor.ts, lsp.ts
│
└── tui/                              # Terminal UI (28 files)
    ├── app.tsx                       # Root App: routes, dialogs, input handling
    ├── home.tsx                      # Home route: logo + prompt
    ├── session.tsx                   # Session route: messages + scroll
    ├── theme.tsx                     # Color system + ASCII logo
    ├── logo.tsx                      # Braille logo
    ├── prompt.tsx                    # Input line
    ├── status-bar.tsx                # Provider | model | cost | session
    ├── spinner.tsx                   # Animated spinner
    ├── routes/                       # Route views
    │   ├── index.ts, chat.tsx, plan.tsx, build.tsx
    ├── dialogs/                      # 10 dialogs
    │   ├── help, model-picker, provider-connect, settings,
    │   │   command-palette, session-list, skill-manager,
    │   │   context-bank, memory-browser, plan-viewer
    ├── components/                   # Shared UI components
    │   ├── message.tsx, thinking.tsx, tool-call.tsx,
    │   │   diff-view.tsx, onboarding/index.tsx
    └── context/                      # React context providers (6)
        ├── route, session, config, theme, toast, plugin
```

## Key Architectural Features

| Feature | Implementation | Files |
|---------|---------------|-------|
| Self-learning loop | ReviewAgent forks after every turn, saves memory | `agent/review.ts`, `memory/manager.ts` |
| Mixed model routing | Classifies prompts by complexity → cheapest model | `provider/router.ts` |
| Context banks | Named snippets auto-inject on trigger match | `context-bank/*` |
| Plan→Build mode | PlanAgent → artifact → Orchestrator spawns BuildAgents | `agent/orchestrator.ts` |
| Cost transparency | Per-message cost, per-session total, per-model breakdown | `cost/tracker.ts` |
| Git-aware sessions | Auto-tag with branch, dirty files, recent commits | `session/snapshot.ts` |
| Two-way import/export | Import from 4 tools, export profile as JSON | `migrate/*` |
| Plugin = npm OR MCP | Plugin system accepts packages + MCP servers | `plugin/*` |
| Skill auto-curation | Agent-created skills auto-archive after 30d | `skill/curator.ts` |
| Live context awareness | Status bar shows git state, diagnostics | `util/git.ts` |

## Database Schema (SQLite + WAL + FTS5)

- `sessions` — id, title, model, provider, branch, cost, git context
- `messages` — session_id, role, content, tool_calls, token_count, cost
- `messages_fts` — FTS5 full-text search across all messages
- `memory` — content, tags, relevance, source (agent/user)
- `memory_fts` — FTS5 search on memory
- `skills` — name, description, source, category, state, usage_count
- `context_banks` — name, content, tags, trigger_pattern
- `plugin_registry` — name, version, source, enabled
