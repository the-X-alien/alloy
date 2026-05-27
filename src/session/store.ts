import { getDb } from "../db/connection.js";
import type { SessionMeta, SessionStatus } from "./types.js";
import type { ChatMessage } from "../providers/interface.js";
import { getGitContext } from "../util/git.js";

export class SessionStore {
  create(model: string, provider: string, title?: string): SessionMeta {
    const db = getDb();
    const id = crypto.randomUUID();
    const now = Date.now();
    const git = getGitContext();
    const branch = git.branch ?? null;

    let displayTitle = title ?? `Session ${new Date(now).toLocaleString()}`;

    db.prepare(`
      INSERT INTO sessions (id, title, model, provider, started_at, branch, project_id, git_commit)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, displayTitle, model, provider, now, branch, git.repoRoot, git.recentCommits[0] ?? null);

    return this.get(id)!;
  }

  get(id: string): SessionMeta | null {
    const db = getDb();
    const row = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return this.rowToMeta(row);
  }

  getAll(): SessionMeta[] {
    const db = getDb();
    const rows = db.prepare(`SELECT * FROM sessions ORDER BY started_at DESC`).all() as any[];
    return rows.map(r => this.rowToMeta(r));
  }

  update(id: string, updates: Partial<SessionMeta>): void {
    const db = getDb();
    const sets: string[] = [];
    const vals: any[] = [];

    if (updates.title !== undefined) { sets.push("title = ?"); vals.push(updates.title); }
    if (updates.model !== undefined) { sets.push("model = ?"); vals.push(updates.model); }
    if (updates.provider !== undefined) { sets.push("provider = ?"); vals.push(updates.provider); }
    if (updates.endedAt !== undefined) { sets.push("ended_at = ?"); vals.push(updates.endedAt); }
    if (updates.estimatedCost !== undefined) { sets.push("estimated_cost = ?"); vals.push(updates.estimatedCost); }
    if (updates.messageCount !== undefined) { sets.push("message_count = ?"); vals.push(updates.messageCount); }
    if (updates.inputTokens !== undefined) { sets.push("input_tokens = ?"); vals.push(updates.inputTokens); }
    if (updates.outputTokens !== undefined) { sets.push("output_tokens = ?"); vals.push(updates.outputTokens); }

    if (sets.length === 0) return;
    vals.push(id);
    db.prepare(`UPDATE sessions SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
  }

  delete(id: string): void {
    const db = getDb();
    db.prepare(`DELETE FROM sessions WHERE id = ?`).run(id);
  }

  search(query: string): SessionMeta[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT DISTINCT s.* FROM sessions s
      LEFT JOIN messages m ON m.session_id = s.id
      LEFT JOIN messages_fts f ON f.rowid = m.id
      WHERE s.title LIKE ? OR f.content MATCH ?
      ORDER BY s.started_at DESC
      LIMIT 50
    `).all(`%${query}%`, query) as any[];
    return rows.map(r => this.rowToMeta(r));
  }

  addMessage(sessionId: string, msg: ChatMessage): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO messages (session_id, role, content, tool_calls, tool_name, timestamp, token_count, model, cost)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      sessionId,
      msg.role,
      msg.content ?? "",
      msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
      null,
      msg.timestamp ?? Date.now(),
      msg.tokenCount ?? 0,
      msg.model ?? null,
      msg.cost ?? 0
    );

    db.prepare(`
      UPDATE sessions SET message_count = message_count + 1, estimated_cost = estimated_cost + ?
      WHERE id = ?
    `).run(msg.cost ?? 0, sessionId);
  }

  getMessages(sessionId: string, limit = 100, offset = 0): ChatMessage[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC LIMIT ? OFFSET ?
    `).all(sessionId, limit, offset) as any[];
    return rows.map(r => ({
      role: r.role,
      content: r.content,
      toolCalls: r.tool_calls ? JSON.parse(r.tool_calls) : undefined,
      timestamp: r.timestamp,
      tokenCount: r.token_count,
      model: r.model,
      cost: r.cost,
    }));
  }

  private rowToMeta(row: any): SessionMeta {
    return {
      id: row.id,
      title: row.title,
      model: row.model ?? "",
      provider: row.provider ?? "",
      startedAt: row.started_at,
      endedAt: row.ended_at ?? undefined,
      messageCount: row.message_count ?? 0,
      inputTokens: row.input_tokens ?? 0,
      outputTokens: row.output_tokens ?? 0,
      estimatedCost: row.estimated_cost ?? 0,
      branch: row.branch ?? undefined,
      projectId: row.project_id ?? undefined,
      gitCommit: row.git_commit ?? undefined,
      parentSessionId: row.parent_session_id ?? undefined,
      status: "active",
    };
  }
}
