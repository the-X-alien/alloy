# Alloy

Multi-model AI coding agent — combining the best features of OpenCode, Claude Code,
Codex CLI, Gemini CLI, and OpenClaw, while fixing the things people complain about.

## One-line Install

**Windows (PowerShell):**
```powershell
irm https://raw.githubusercontent.com/the-X-alien/alloy/main/install.ps1 | iex
```

**macOS/Linux:**
```bash
curl -fsSL https://raw.githubusercontent.com/the-X-alien/alloy/main/install.sh | bash
```

## Quick Start

```bash
# Set your API key (any provider)
export ANTHROPIC_API_KEY="sk-ant-..."
# or: export OPENAI_API_KEY="sk-..."
# or: export GEMINI_API_KEY="..."

# Start Alloy
alloy
```

Or import keys from tools you already use:
```bash
alloy --import
```

## Features

### Multi-Provider
Switch between 18+ AI providers mid-session:
- OpenAI (GPT-4o, o3-mini, GPT-4.1 Nano)
- Anthropic (Claude Sonnet 4, Haiku 3.5, Opus 4)
- Google Gemini (2.5 Pro, 2.5 Flash)
- DeepSeek, xAI/Grok, Mistral, Groq, Together, Fireworks
- OpenRouter, Perplexity, Cerebras, DeepInfra
- GitHub Copilot, Azure OpenAI
- Local: Ollama, LM Studio

### Slash Commands
| Command | Description |
|---|---|
| `/help` | Show all commands |
| `/model <name>` | Switch AI model |
| `/provider <name>` | Switch AI provider |
| `/models` | List all models |
| `/providers` | List all providers |
| `/clear` | Clear conversation |
| `/new` | New session |
| `/status` | Show session status |
| `/exit` | Quit Alloy |
| `/uninstall` | Remove Alloy |
| `/import` | Import from other tools |
| `/skills` | List skills |
| `/theme` | Change theme |
| `/copy` | Copy last response |

### Smart Migration
Detects and imports from:
- **Claude Code** (~/.claude/)
- **OpenCode** (~/.config/opencode/)
- **OpenClaw** (~/.openclaw/)

Auto-imports API keys on first launch.

### Cost Governor
Real-time cost tracking with hard budget caps.
No surprise bills. See burn rate in the status bar.

### Skill System
Extend Alloy with skills in `~/.alloy/skills/`.
Each skill is a folder with a `SKILL.md` description.

### Keyboard Shortcuts
| Key | Action |
|---|---|
| `Ctrl+1-9` | Switch models |
| `Ctrl+L` | Toggle help |
| `Esc` | Quit |
| `Up/Down` | Scroll conversation |

## Architecture

```
src/
├── cli.tsx             # Entry point + CLI args
├── tui/                # Terminal UI (Ink + React)
│   ├── app.tsx         # Main application state
│   ├── chat.tsx        # Chat component
│   ├── status-bar.tsx  # Status bar
│   └── theme.tsx       # Colors + ASCII art logo
├── providers/          # LLM provider abstraction (18+)
│   ├── registry.ts     # Provider database
│   ├── interface.ts    # Provider interface
│   ├── openai.ts       # OpenAI adapter
│   ├── anthropic.ts    # Anthropic adapter
│   ├── google.ts       # Google Gemini adapter
│   ├── openai-compatible.ts  # Generic adapter
│   └── local.ts        # Ollama/LM Studio adapter
├── commands/           # Slash command system
│   └── registry.ts     # Command registration + handlers
├── skills/             # Skill plugin system
│   └── manager.ts      # Skill discovery + loading
├── migrate/            # Migration from other tools
│   └── importer.ts     # Claude/OpenCode/OpenClaw import
├── session/            # Session management
│   └── manager.ts      # Session CRUD
└── cost/               # Cost governance
    └── governor.ts     # Budget tracking
```

## Uninstall

```bash
alloy --uninstall
```
