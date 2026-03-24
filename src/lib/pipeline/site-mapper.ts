import * as cheerio from "cheerio";

import type { SiteMap } from "./types";

// ---------------------------------------------------------------------------
// Extract a complete map of links, images, and sections from HTML
// ---------------------------------------------------------------------------

export function mapSite(html: string, baseUrl: string): SiteMap {
  const $ = cheerio.load(html);

  // ── Links ────────────────────────────────────────────────────────────
  const links: SiteMap["links"] = [];
  $("a[href]").each((_, el) => {
    const $el = $(el);
    const href = $el.attr("href") ?? "";
    const text = $el.text().trim().slice(0, 80) || $el.attr("aria-label") || "";

    // Resolve relative URLs
    let resolvedHref = href;
    try {
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        resolvedHref = new URL(href, baseUrl).toString();
      }
    } catch {
      // Keep original
    }

    // Figure out where in the page this link lives
    const location = getLocation($, $el);

    if (text || href) {
      links.push({ text, href: resolvedHref, location });
    }
  });

  // ── Images ───────────────────────────────────────────────────────────
  const images: SiteMap["images"] = [];
  $("img[src], img[srcset], source[srcset]").each((_, el) => {
    const $el = $(el);
    let src = $el.attr("src") ?? "";
    const srcset = $el.attr("srcset") ?? "";
    const alt = $el.attr("alt") ?? "";

    // Use highest-res from srcset if available
    if (srcset) {
      const parts = srcset.split(",").map((s) => s.trim());
      const last = parts[parts.length - 1];
      if (last) {
        src = last.split(/\s+/)[0] ?? src;
      }
    }

    // Resolve URL
    try {
      if (src && !src.startsWith("data:")) {
        src = new URL(src, baseUrl).toString();
      }
    } catch {
      // Keep original
    }

    const location = getLocation($, $el);
    if (src) {
      images.push({ src, alt, location });
    }
  });

  // Deduplicate images by src
  const uniqueImages = [...new Map(images.map((i) => [i.src, i])).values()];

  // ── Sections ─────────────────────────────────────────────────────────
  const sections: SiteMap["sections"] = [];
  $("header, main, footer, section, nav, [class*='hero'], [class*='banner'], [class*='slider'], [class*='collection'], [class*='product']").each((_, el) => {
    const $el = $(el);
    const tag = "tagName" in el ? (el.tagName as string) : "";
    const id = $el.attr("id") ?? "";
    const classes = $el.attr("class") ?? "";

    // Brief content summary
    const headingText = $el.find("h1, h2, h3").first().text().trim().slice(0, 60);
    const imgCount = $el.find("img").length;
    const linkCount = $el.find("a").length;
    const summary = [
      headingText ? `heading: "${headingText}"` : "",
      imgCount ? `${imgCount} images` : "",
      linkCount ? `${linkCount} links` : "",
    ]
      .filter(Boolean)
      .join(", ");

    sections.push({ tag, id, classes: classes.slice(0, 200), summary });
  });

  return {
    links: dedupeLinks(links),
    images: uniqueImages,
    sections,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLocation(
  $: cheerio.CheerioAPI,
  $el: ReturnType<cheerio.CheerioAPI>,
): string {
  const parent = $el.closest("header, nav, main, footer, section, [class*='hero'], [class*='banner']");
  if (parent.length) {
    const tag = parent.prop("tagName")?.toLowerCase() ?? "";
    const cls = parent.attr("class")?.split(/\s+/).slice(0, 3).join(".") ?? "";
    return cls ? `${tag}.${cls}` : tag;
  }
  return "body";
}

function dedupeLinks(links: SiteMap["links"]): SiteMap["links"] {
  const seen = new Set<string>();
  return links.filter((link) => {
    const key = `${link.href}|${link.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Format site map as text for inclusion in prompts
// ---------------------------------------------------------------------------

export function formatSiteMap(siteMap: SiteMap): string {
  let out = "## SITE MAP\n\n";

  out += "### Navigation Links\n";
  for (const link of siteMap.links) {
    out += `- [${link.text || "(no text)"}](${link.href}) — location: ${link.location}\n`;
  }

  out += "\n### Images (MUST preserve these exact URLs)\n";
  for (const img of siteMap.images) {
    out += `- ${img.src}\n  alt: "${img.alt}" — location: ${img.location}\n`;
  }

  out += "\n### Page Sections\n";
  for (const sec of siteMap.sections) {
    const idStr = sec.id ? `#${sec.id}` : "";
    const clsStr = sec.classes ? `.${sec.classes.split(/\s+/).slice(0, 3).join(".")}` : "";
    out += `- <${sec.tag}${idStr}${clsStr}> — ${sec.summary || "(empty)"}\n`;
  }

  return out;
}
