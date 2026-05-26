#!/usr/bin/env node
import { StrictMode } from "react";
import { render } from "ink";
import { App } from "./tui/app.js";
import { detectTools, importFrom, importAll, applyImport } from "./migrate/importer.js";
import { uninstall } from "./uninstall.js";

const args = process.argv.slice(2);

async function main() {
  if (args.includes("--uninstall") || args.includes("uninstall")) {
    const msgs = uninstall();
    for (const m of msgs) console.log(m);
    process.exit(0);
  }

  if (args.includes("--import") || args.includes("import")) {
    const idx = args.indexOf("--import") !== -1 ? args.indexOf("--import") : args.indexOf("import");
    const target = args[idx + 1];
    if (target) {
      if (target === "all") {
        const results = importAll();
        for (const r of results) {
          console.log(`\nImporting from ${r.source}...`);
          const msgs = applyImport(r);
          for (const m of msgs) console.log(`  ${m}`);
        }
      } else {
        const result = importFrom(target as any);
        console.log(`\nImporting from ${target}...`);
        const msgs = applyImport(result);
        for (const m of msgs) console.log(`  ${m}`);
      }
    } else {
      console.log("Detected tools:");
      const detected = detectTools();
      for (const d of detected) {
        console.log(`  ${d.tool}: ${d.detected ? "detected" : "not found"}`);
      }
    }
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h") || args.includes("help")) {
    console.log(`
Alloy - Multi-model AI coding agent

Usage:
  alloy            Start interactive TUI
  alloy --help     Show this help
  alloy --import   Import configs from other tools
  alloy --uninstall Remove Alloy

Commands (inside TUI):
  /help            Show commands
  /model <name>    Switch model
  /provider <name> Switch provider
  /clear           Clear conversation
  /new             New session
  /status          Show session status
  /exit            Quit
  /uninstall       Remove Alloy

Providers:
  Set any of these env vars:
  OPENAI_API_KEY, ANTHROPIC_API_KEY, GEMINI_API_KEY
  DEEPSEEK_API_KEY, GROQ_API_KEY, XAI_API_KEY
  (and 12+ more — see docs)

Config:
  ~/.alloy/        User config directory
  ~/.alloy/skills/ Skill plugins
`);
    process.exit(0);
  }

  const { waitUntilExit, clear } = render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  process.on("SIGINT", () => {
    try { clear(); } catch {}
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    try { clear(); } catch {}
    process.exit(0);
  });

  await waitUntilExit();
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
