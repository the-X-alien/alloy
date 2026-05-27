import type { ToolHandler } from "../tool-registry.js";

export function createWebSearchTool(): ToolHandler {
  return {
    schema: {
      name: "web_search",
      description: "Search the web using DuckDuckGo. Returns up to 10 results with titles, snippets, and URLs.",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          maxResults: { type: "number", description: "Max results (1-15, default 8)" },
        },
        required: ["query"],
      },
    },
    execute: async (args) => {
      const query = String(args.query);
      const maxResults = Math.min(Math.max(Number(args.maxResults ?? 8), 1), 15);

      try {
        const url = "https://html.duckduckgo.com/html/";
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "text/html",
          },
          body: "q=" + encodeURIComponent(query),
          signal: AbortSignal.timeout(20000),
        });
        const html = await resp.text();

        if (html.includes("anomaly") || html.includes("select all squares")) {
          return `Search temporarily blocked for "${query}". DuckDuckGo requires a CAPTCHA. Try again later or use a more specific query.`;
        }

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
          return `Search timed out for "${query}". Try a more specific query.`;
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
  const resultBlocks = html.split('<div class="result results_links results_links_deep web-result ');

  for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
    const block = resultBlocks[i];

    const titleMatch = block.match(/<a[^>]*class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;

    const url = titleMatch[1];
    const title = titleMatch[2].replace(/<[^>]+>/g, "").trim();

    const snippetMatch = block.match(/<a[^>]*class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);
    const snippet = snippetMatch
      ? snippetMatch[1].replace(/<[^>]+>/g, "").trim()
      : "";

    if (title && url) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}
