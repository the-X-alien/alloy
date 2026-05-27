import type { ToolHandler } from "../tool-registry.js";

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

let cookieJar = "";
let lastCookieFetch = 0;

const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  "DNT": "1",
  "Connection": "keep-alive",
};

async function getCookies(): Promise<string> {
  if (cookieJar && Date.now() - lastCookieFetch < 300_000) return cookieJar;
  try {
    const resp = await fetch("https://html.duckduckgo.com/html/", {
      headers: { ...BROWSER_HEADERS, "Accept-Language": "en-US,en;q=0.9" },
      signal: AbortSignal.timeout(10000),
    });
    const setCookie = resp.headers.get("set-cookie");
    if (setCookie) {
      cookieJar = setCookie.split(",").map((c: string) => c.split(";")[0]).join("; ");
    }
    lastCookieFetch = Date.now();
  } catch {}
  return cookieJar;
}

async function searchEndpoint(url: string, body: string, headers: Record<string, string>): Promise<string | null> {
  try {
    const resp = await fetch(url, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(20000),
      redirect: "manual",
    });
    const html = await resp.text();
    if (html.includes("anomaly") || html.includes("select all squares")) return null;
    if (html.includes("result__a") || html.includes("result__snippet")) return html;
    return null;
  } catch {
    return null;
  }
}

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
      const encoded = encodeURIComponent(query);

      try {
        const cookies = await getCookies();
        const baseHeaders: Record<string, string> = {
          ...BROWSER_HEADERS,
          "Content-Type": "application/x-www-form-urlencoded",
        };
        if (cookies) baseHeaders["Cookie"] = cookies;

        let html: string | null = null;

        const attempts = [
          { url: "https://html.duckduckgo.com/html/", body: `q=${encoded}`, headers: { ...baseHeaders } },
          { url: "https://lite.duckduckgo.com/lite/", body: `q=${encoded}`, headers: { ...baseHeaders } },
          { url: "https://html.duckduckgo.com/html/", body: `q=${encoded}`, headers: { ...baseHeaders, "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" } },
        ];

        for (const attempt of attempts) {
          html = await searchEndpoint(attempt.url, attempt.body, attempt.headers);
          if (html) break;
          await new Promise(r => setTimeout(r, 500));
        }

        if (!html) {
          return `Web search results for "${query}":
  (search engine temporarily unavailable - rate limited or blocked)
  
  Try a more specific query or use web_fetch to access a known URL directly.`;
        }

        const results = parseResults(html, maxResults);

        if (results.length === 0) {
          return `Web search results for "${query}":
  (no results found)`;
        }

        const lines = [`Web search results for "${query}":`, ""];
        for (let i = 0; i < results.length; i++) {
          const r = results[i];
          lines.push(`${i + 1}. ${r.title}`);
          if (r.snippet) lines.push(`   ${r.snippet}`);
          lines.push(`   ${r.url}`);
          lines.push("");
        }
        return lines.join("\n");
      } catch (err: any) {
        if (err?.name === "TimeoutError" || err?.name === "AbortError") {
          return `Web search timed out for "${query}". Try a more specific query.`;
        }
        return `Web search failed: ${err?.message ?? "Unknown error"}`;
      }
    },
  };
}

function parseResults(html: string, maxResults: number): SearchResult[] {
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
