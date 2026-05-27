import { execSync } from "node:child_process";
import * as os from "node:os";

export function copyToClipboard(text: string): boolean {
  try {
    const platform = os.platform();
    if (platform === "win32") {
      execSync(`Set-Clipboard -Value "${text.replace(/"/g, '\\"')}"`, { shell: "powershell" });
    } else if (platform === "darwin") {
      execSync(`pbcopy`, { input: text });
    } else {
      execSync(`xclip -selection clipboard`, { input: text });
    }
    return true;
  } catch {
    return false;
  }
}
