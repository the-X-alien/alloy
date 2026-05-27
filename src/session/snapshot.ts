import { getGitContext, type GitContext } from "../util/git.js";

export interface SessionSnapshot {
  id: string;
  timestamp: number;
  messageCount: number;
  git: GitContext;
}

export function createSnapshot(sessionId: string, messageCount: number): SessionSnapshot {
  return {
    id: sessionId,
    timestamp: Date.now(),
    messageCount,
    git: getGitContext(),
  };
}
