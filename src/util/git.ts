import * as fs from "node:fs";
import * as path from "node:path";

export interface GitContext {
  branch: string | null;
  repoRoot: string | null;
  dirtyFiles: number;
  recentCommits: string[];
}

export function getGitContext(dir?: string): GitContext {
  const cwd = dir ?? process.cwd();
  try {
    const repoRoot = findGitRoot(cwd);
    if (!repoRoot) return { branch: null, repoRoot: null, dirtyFiles: 0, recentCommits: [] };

    const branch = execSync("git rev-parse --abbrev-ref HEAD", cwd);
    const dirtyOut = execSync("git status --porcelain", cwd);
    const dirtyFiles = dirtyOut ? dirtyOut.split("\n").filter(l => l.trim()).length : 0;
    const logOut = execSync("git log --oneline -5", cwd);
    const recentCommits = logOut ? logOut.split("\n").filter(l => l.trim()) : [];

    return { branch, repoRoot, dirtyFiles, recentCommits };
  } catch {
    return { branch: null, repoRoot: null, dirtyFiles: 0, recentCommits: [] };
  }
}

function findGitRoot(dir: string): string | null {
  let current = path.resolve(dir);
  for (let i = 0; i < 20; i++) {
    if (fs.existsSync(path.join(current, ".git"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
  return null;
}

function execSync(cmd: string, cwd: string): string | null {
  try {
    const { execSync } = require("node:child_process");
    return execSync(cmd, { cwd, encoding: "utf-8", timeout: 3000 }).trim();
  } catch {
    return null;
  }
}
