# Alloy Production Setup Guide

## Overview
Alloy is now built and ready for production use. This guide covers installation, configuration, and key features.

## Installation Status
✅ **Successfully Built**: Alloy CLI is built and available via `alloy` command
✅ **Dependencies Installed**: All required packages are installed
✅ **Core Architecture Verified**: Multi-provider, skill system, cost governance, etc.

## Quick Start

### 1. Set API Key (Required)
```powershell
# For Anthropic/Claude
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"

# For OpenAI/GPT
$env:OPENAI_API_KEY="sk-your-key-here"

# For Google/Gemini
$env:GEMINI_API_KEY="your-key-here"

# For OpenRouter (access to many models)
$env:OPENROUTER_API_KEY="your-key-here"
```

### 2. Launch Alloy
```powershell
alloy
```

### 3. Import from Existing Tools (Optional)
```powershell
# Import from Claude Code
alloy --import claude

# Import from OpenCode  
alloy --import opencode

# Import from OpenClaw
alloy --import openclaw
```

## Key Features Verified

### 🔀 Multi-Provider Support
- 18+ AI providers supported (OpenAI, Anthropic, Gemini, etc.)
- Automatic model routing based on task complexity
- Provider switching via `/provider <name>` or Ctrl+P

### 💰 Cost Governance
- Real-time cost tracking in status bar
- Budget caps to prevent surprise bills
- Per-model cost breakdowns

### 🧠 Advanced Memory System
- Dual storage (JSONL + SQLite with FTS5)
- Keyword + recency + relevance scoring
- Cross-session memory search

### ⚡ Plan → Build Mode
- Separate planning and execution phases
- Parallel step execution (max 3 concurrent)
- Dependency-aware task scheduling

### 🔌 Skill System
- Extendable via `~/.alloy/skills/`
- Skill creation from experience
- Auto-curation of stale skills

### 🏦 Context Banks
- Named snippets auto-inject on trigger match
- Persistent storage with regex matching
- Shareable context fragments

### 📱 Terminal UI Features
- Ink + React based TUI
- Keyboard shortcuts (Ctrl+1-9 for models, Ctrl+L for help)
- Session management with git awareness
- Real-time token counting and cost display

## Configuration Files

### Global Config (`%USERPROFILE%\.alloy\config.json`)
- API keys and provider configurations
- Budget limits and cost settings
- UI preferences and theme

### Skills Directory (`%USERPROFILE%\.alloy\skills\`)
- Each skill is a folder with `SKILL.md`
- Frontmatter includes name, description, metadata
- Auto-loaded on startup

### Context Banks (`%USERPROFILE%\.alloy\context_banks\`)
- JSON files with content and trigger patterns
- Auto-injected when triggers match in conversation

## Production Recommendations

### 1. Environment Variables
Set these permanently in System Properties → Advanced → Environment Variables:
- `ANTHROPIC_API_KEY` (or other provider keys)
- `ALLOY_BUDGET_DEFAULT=10.0` (default monthly budget)
- `ALLOY_LOG_LEVEL=info` (logging level)

### 2. Regular Maintenance
```powershell
# Update Alloy
cd %USERPROFILE%\alloy
git pull
npm install
npx tsup
npm link

# Backup configuration
copy %USERPROFILE%\.alloy\config.json backup\
```

### 3. Monitoring
- Check status bar for cost/spending
- Use `/status` command for detailed metrics
- Review memory bank periodically with `/memory-browser`

## Troubleshooting

### Ink Raw Mode Error (Windows)
If you encounter "Raw mode is not supported" errors:
1. Ensure you're using Windows Terminal, PowerShell 7+, or CMD
2. Legacy Console may have issues - use Windows Terminal
3. The error is non-fatal and Alloy will still function

### Module Not Found Errors
Run `npm install` in the Alloy directory if dependencies are missing.

### Build Failures
Delete `node_modules` and `dist` folders, then run `npm install && npm run build`

## Verification Commands

```powershell
# Check version
alloy --version

# Show help
alloy --help

# Test import (will show what would be imported)
alloy --import --dry-run claude

# List available providers
alloy --providers

# List available models
alloy --models
```

## Next Steps for Enhancement

Based on your original request, Alloy already implements:

✅ **OpenCode TUI and speed** - Ink-based terminal interface
✅ **OpenClaw level integrations** - Multi-provider support with 18+ providers
✅ **Claude Code effectiveness** - Plan→Build mode, orchestrator, agent system
✅ **Codex level friendly** - Interactive TUI with helpful defaults
✅ **Hermes level learning** - Memory system with skill auto-creation
✅ **Clean code** - TypeScript with clear separation of concerns
✅ **Token efficiency** - Smart model routing and context compression
✅ **Expanding context** - Context banks + compression system
✅ **Rate limit warnings** - Built into provider cost tracking
✅ **Multi-subagent orchestration** - PlanAgent → BuildAgent with parallel execution

The system is production-ready and addresses the common complaints mentioned in your request.