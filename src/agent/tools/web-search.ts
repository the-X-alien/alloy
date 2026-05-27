import type { ToolHandler } from "../tool-registry.js";

export function createWebSearchTool(): ToolHandler {
  return {
    schema: {
      name: "web_search",
      description: "Search the web using DuckDuckGo. Returns up to 8 results with titles, snippets, and URLs.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          maxResults: { type: "number", description: "Max results (1-20, default 8)" },
        },
        required: ["query"],
      },
    },
    execute: async (args) => {
      const query = String(args.query);
      const maxResults = Math.min(Math.max(Number(args.maxResults ?? 8), 1), 20);

      try {
        const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html",
          },
          signal: AbortSignal.timeout(15000),
        });
        const html = await resp.text();

        const results = parseDuckDuckGoResults(html, maxResults);

        if (results.length === 0) {
          const lines = [`Web search results for "${query}":`, "  (no results found)"];
          return lines.join("\n");
        }

        const lines = [`Web search results for "${query}":`, ""];
        for (const r of results) {
          lines.push(`  ${r.title}`);
          lines.push(`  ${r.url}`);
          if (r.snippet) lines.push(`  ${r.snippet}`);
          lines.push("");
        }
        return lines.join("\n");
      } catch (err: any) {
        if (err?.name === "TimeoutError" || err?.name === "AbortError") {
          return `Search timed out for "${query}". DuckDuckGo may be rate-limiting. Try a more specific query.`;
        }
        return `Search failed: ${err?.message ?? "Unknown error"}`;
      }
    },
  };
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function parseDuckDuckGoResults(html: string, maxResults: number): SearchResult[] {
  const results: SearchResult[] = [];

  const linkRegex = /<a[^>]*rel="nofollow"[^>]*class="result-link"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRegex = /<td[^>]*class="result-snippet"[^>]*>([\s\S]*?)<\/td>/gi;

  const links: { url: string; title: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = linkRegex.exec(html)) !== null) {
    let url = m[1];
    let title = m[2].replace(/<[^>]+>/g, "").trim();
    if (url.startsWith("//")) url = "https:" + url;
    if (!url.startsWith("http")) url = "https://" + url;
    links.push({ url, title });
  }

  const snippets: string[] = [];
  while ((m = snippetRegex.exec(html)) !== null) {
    snippets.push(m[1].replace(/<[^>]+>/g, "").trim());
  }

  for (let i = 0; i < Math.min(links.length, maxResults); i++) {
    results.push({
      title: links[i].title || "(no title)",
      url: links[i].url,
      snippet: snippets[i] || "",
    });
  }

  return results;
}
