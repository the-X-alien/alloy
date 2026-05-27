import type { ToolHandler } from "../tool-registry.js";

export function createWebFetchTool(): ToolHandler {
  return {
    schema: {
      name: "web_fetch",
      description: "Fetch and read the content of a web page. Use to read documentation, API responses, or any URL.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "The URL to fetch" },
          maxLength: { type: "number", description: "Max characters to return (default 15000)" },
        },
        required: ["url"],
      },
    },
    execute: async (args) => {
      const url = String(args.url);
      const maxLength = Number(args.maxLength ?? 15000);

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        return "Error: URL must start with http:// or https://";
      }

      try {
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/json,*/*",
          },
          signal: AbortSignal.timeout(20000),
          redirect: "follow",
        });

        const contentType = resp.headers.get("content-type") ?? "";
        const isJSON = contentType.includes("json");

        let text: string;
        if (isJSON) {
          text = JSON.stringify(await resp.json(), null, 2);
        } else {
          const raw = await resp.text();
          text = stripHTML(raw);
        }

        const result = `URL: ${url}\nStatus: ${resp.status} ${resp.statusText}\nContent-Type: ${contentType}\n\n${text}`;

        if (result.length > maxLength) {
          return result.slice(0, maxLength) + `\n\n... (truncated, full length was ${result.length} characters)`;
        }

        return result;
      } catch (err: any) {
        if (err?.name === "TimeoutError" || err?.name === "AbortError") {
          return `Request timed out for ${url}`;
        }
        return `Failed to fetch ${url}: ${err?.message ?? "Unknown error"}`;
      }
    },
  };
}

function stripHTML(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}
