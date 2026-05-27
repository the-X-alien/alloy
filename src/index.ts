#!/usr/bin/env node
import React from "react";
import { render } from "ink";
import { App } from "./tui/app.js";
import { initConfig } from "./config/loader.js";
import { migrateConfig } from "./config/migrate.js";

migrateConfig();
const configLoader = initConfig();

const { waitUntilExit } = render(
  React.createElement(App, { configLoader })
);

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

await waitUntilExit();
