# Alloy Architecture

## Vision
A single CLI that combines the best features of OpenCode, Claude Code, Codex CLI, Gemini CLI,
Hermes, and gh CLI — while fixing the things people hate about each.

## Core Principles

1. **Provider-agnostic** — Swap OpenAI, Anthropic, Gemini, local (Ollama), or any OpenAI-compatible
   provider mid-session. No lock-in.

2. **Cost-governed by default** — Hard spend caps, per-model budgets, automatic fallback to
   cheaper models when you hit limits. Never a surprise bill.

3. **Sandboxed execution** — Every command runs in a container/sandbox by default.
   Opt-out per command, not opt-in.

4. **Undo tree** — Every edit creates a node in a DAG. Roll back any single change,
   not just the last one.

5. **Hybrid context** — Local RAG over your codebase + LLM context window. No amnesia
   after 100 turns.

6. **Session-first** — SQLite-backed, shareable sessions. Export as self-contained HTML.
   Pair agents, share live, review async.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                    TUI Layer                     │
│  (Ink/React — components, themes, 60fps)        │
├─────────────────────────────────────────────────┤
│                 Session Layer                    │
│  (SQLite persistence, timeline, undo DAG)        │
├─────────────────────────────────────────────────┤
│                Provider Layer                    │
│  (OpenAI / Anthropic / Gemini / Local adapter)   │
├─────────────────────────────────────────────────┤
│                Cost Governor                     │
│  (Budget tracking, fallback routing, alerts)     │
├─────────────────────────────────────────────────┤
│                Sandbox Layer                     │
│  (Container sandbox, permission system)          │
├─────────────────────────────────────────────────┤
│                Context Engine                    │
│  (Local RAG, file indexing, project map)         │
└─────────────────────────────────────────────────┘
```

## Planned Features (by complaint fixed)

| Complaint | Alloy Fix |
|---|---|
| Cost scares | Hard caps + cheap-model fallback + real-time burn display |
| Context amnesia | Hybrid context: local RAG + LLM, project map persists |
| Hallucinated diffs | Sandbox preview + diff approval per file |
| Single model lock-in | Swap providers mid-conversation |
| No undo | DAG undo tree — roll back any individual edit |
| Slow startup | Lazy provider loading, SQLite warm cache |
| Privacy anxiety | Local models first-class, no telemetry |
| Tool safety | Sandbox by default, permission presets |
| No collaboration | Session sharing via HTML/file, pairing protocol |
| Plugin hell | Unified plugin system, one config format |

## File Structure

```
src/
├── index.tsx              # Entry point
├── tui/                   # Terminal UI (Ink components)
│   ├── app.tsx            # Main app + routing
│   ├── chat.tsx           # Chat message area
│   ├── prompt.tsx         # Input prompt with autocomplete
│   ├── status-bar.tsx     # Multi-provider status bar
│   ├── sidebar.tsx        # Session info + file changes
│   ├── cost-display.tsx   # Live cost burn display
│   └── theme.ts          # Theme system
├── providers/             # LLM provider abstraction
│   ├── interface.ts       # Provider interface
│   ├── registry.ts        # Provider registry
│   ├── openai.ts          # OpenAI / any OpenAI-compatible
│   ├── anthropic.ts       # Anthropic Claude
│   └── local.ts           # Ollama / local models
├── session/               # Session management
│   ├── manager.ts         # CRUD + navigation
│   └── store.ts           # SQLite schema + queries
├── cost/                  # Cost governance
│   └── governor.ts        # Budget tracking + routing
├── sandbox/               # Execution sandbox
│   └── executor.ts        # Container/permission system
└── context/               # Local context engine
    └── rag.ts             # File indexing + retrieval
```
