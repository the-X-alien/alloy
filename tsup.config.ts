import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/cli.tsx"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  sourcemap: true,
  dts: true,
});