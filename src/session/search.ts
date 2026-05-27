import { getDb } from "../db/connection.js";

export interface SearchResult {
  sessionId: string;
  messageId: number;
  content: string;
  role: string;
  timestamp: number;
  snippet: string;
}

export class SessionSearch {
  search(query: string, limit = 20): SearchResult[] {
    const db = getDb();
    const rows = db.prepare(`
      SELECT m.id, m.session_id, m.content, m.role, m.timestamp,
             snippet(messages_fts, 1, '<mark>', '</mark>', '...', 40) AS snippet
      FROM messages_fts f
      JOIN messages m ON m.id = f.rowid
      WHERE messages_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(query, limit) as any[];
    return rows.map(r => ({
      sessionId: r.session_id,
      messageId: r.id,
      content: r.content,
      role: r.role,
      timestamp: r.timestamp,
      snippet: r.snippet,
    }));
  }
}
