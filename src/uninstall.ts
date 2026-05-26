import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { execSync } from "node:child_process";

export function uninstall(): string[] {
  const messages: string[] = [];

  messages.push("Uninstalling Alloy...");

  try {
    execSync("npm uninstall -g alloy", { stdio: "pipe" });
    messages.push("Removed global 'alloy' command");
  } catch {
    try {
      execSync("npm rm -g alloy", { stdio: "pipe" });
    } catch {
      messages.push("Note: 'alloy' was not globally installed via npm");
    }
  }

  const alloyDir = path.join(os.homedir(), ".alloy");
  if (fs.existsSync(alloyDir)) {
    try {
      fs.rmSync(alloyDir, { recursive: true, force: true });
      messages.push("Removed ~/.alloy directory");
    } catch { }
  }

  messages.push("Alloy has been uninstalled.");
  messages.push("To remove the project files, delete the project directory manually.");

  return messages;
}
