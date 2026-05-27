#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./tui/app.js";
import { initConfig } from "./config/loader.js";
import { migrateConfig } from "./config/migrate.js";

const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`Alloy - Multi-model AI coding agent
Usage: alloy [options]

Options:
  --model <name>       Start with a specific model
  --continue           Resume last session
  --plan "<goal>"      Start in plan mode
  --session <id>       Resume a specific session
  --import <tool>      Import config from another tool
  --help               Show this help
  --version            Show version`);
  process.exit(0);
}

if (args.includes("--version") || args.includes("-v")) {
  console.log("Alloy v0.1.0");
  process.exit(0);
}

if (args.includes("--import") && args[args.indexOf("--import") + 1]) {
  const source = args[args.indexOf("--import") + 1] as "claude" | "opencode" | "openclaw";
  const { importFrom, applyImport } = await import("./migrate/importer.js");
  const result = importFrom(source);
  const msgs = applyImport(result);
  for (const m of msgs) console.log(m);
  process.exit(0);
}

migrateConfig();
const configLoader = initConfig();

const { waitUntilExit } = render(
  React.createElement(App, { configLoader })
);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

await waitUntilExit();
