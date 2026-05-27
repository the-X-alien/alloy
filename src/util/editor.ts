import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

export function openInEditor(content: string, extension = ".md"): string | null {
  const tmpFile = path.join(os.tmpdir(), `alloy-edit-${Date.now()}${extension}`);
  fs.writeFileSync(tmpFile, content, "utf-8");

  const editor = process.env.EDITOR || process.env.VISUAL || getDefaultEditor();
  if (!editor) return null;

  const result = spawnSync(editor, [tmpFile], { stdio: "inherit", shell: true });
  if (result.status !== 0) return null;

  const edited = fs.readFileSync(tmpFile, "utf-8");
  try { fs.unlinkSync(tmpFile); } catch { }
  return edited;
}

function getDefaultEditor(): string {
  const platform = os.platform();
  if (platform === "win32") return "notepad";
  if (platform === "darwin") return "open -t";
  return "nano";
}
