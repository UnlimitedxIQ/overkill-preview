import { NextRequest, NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ---------------------------------------------------------------------------
// In-memory rate limiter: 10 requests per hour per IP
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  // Immutable update
  rateLimitMap.set(ip, { count: entry.count + 1, resetAt: entry.resetAt });
  return false;
}

// ---------------------------------------------------------------------------
// URL validation helpers
// ---------------------------------------------------------------------------

function isValidUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isPrivateOrLocalhost(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname === "[::1]"
    ) {
      return true;
    }

    // Block private IP ranges
    const privateRanges = [
      /^10\.\d+\.\d+\.\d+$/,
      /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
      /^192\.168\.\d+\.\d+$/,
    ];

    return privateRanges.some((r) => r.test(hostname));
  } catch {
    return true; // If we can't parse it, block it
  }
}

// ---------------------------------------------------------------------------
// POST /api/scrape
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 10 requests per hour." },
      { status: 429 },
    );
  }

  // Parse body
  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { url } = body;

  if (!url || typeof url !== "string") {
    return NextResponse.json(
      { error: "Missing required field: url" },
      { status: 400 },
    );
  }

  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: "Invalid URL. Must start with http:// or https://." },
      { status: 400 },
    );
  }

  if (isPrivateOrLocalhost(url)) {
    return NextResponse.json(
      { error: "URLs pointing to localhost or private IPs are not allowed." },
      { status: 400 },
    );
  }

  // Fetch and scrape
  let html: string;
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; Overkill/1.0; +https://overkill.dev)",
        Accept: "text/html",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Failed to fetch URL. The site returned status ${response.status}.`,
        },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      return NextResponse.json(
        { error: "URL does not return HTML content." },
        { status: 400 },
      );
    }

    html = await response.text();
  } catch (err) {
    const message =
      err instanceof Error && err.name === "TimeoutError"
        ? "Request timed out. The site took too long to respond."
        : "Could not fetch the URL. The site may block automated access.";

    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Parse with cheerio
  const $ = cheerio.load(html);
  const parsedOrigin = new URL(url).origin;

  const title = $("title").first().text().trim() || null;
  const metaDescription =
    $('meta[name="description"]').attr("content")?.trim() || null;

  // Collect internal links (same-origin hrefs)
  const seen = new Set<string>();
  const pages: { url: string; title: string | null; path: string }[] = [];

  // Always include the submitted URL itself
  const rootPath = new URL(url).pathname;
  seen.add(rootPath);
  pages.push({ url, title, path: rootPath });

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    let resolved: URL;
    try {
      resolved = new URL(href, url);
    } catch {
      return; // Skip malformed hrefs
    }

    // Only same-origin links
    if (resolved.origin !== parsedOrigin) return;

    // Normalize: strip hash and trailing slash, skip non-page extensions
    resolved.hash = "";
    let path = resolved.pathname.replace(/\/+$/, "") || "/";

    if (/\.(png|jpe?g|gif|svg|webp|css|js|pdf|zip|ico)$/i.test(path)) return;

    if (seen.has(path)) return;
    seen.add(path);

    const linkText = $(el).text().trim() || null;
    pages.push({
      url: `${resolved.origin}${path}`,
      title: linkText,
      path,
    });
  });

  return NextResponse.json({
    pages,
    title,
    metaDescription,
    screenshot: null, // Placeholder — will use Firecrawl later
  });
}
