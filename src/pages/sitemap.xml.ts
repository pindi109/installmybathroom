// Single flat sitemap served directly at /sitemap.xml — no sitemap index, no
// redirect indirection. Mirrors the pattern already proven reliable on the
// sibling installmykitchen.co.uk site, which has never had a GSC fetch issue.
//
// URLs are derived from the actual page files via import.meta.glob rather than
// a hardcoded slug list, so this can never drift out of sync with real routes.
const BUILD_DATE = new Date().toISOString().slice(0, 10);

const SECTION_META: Record<string, { changefreq: string; priority: string }> = {
  "": { changefreq: "weekly", priority: "1.0" },
  areas: { changefreq: "weekly", priority: "0.7" },
  services: { changefreq: "monthly", priority: "0.7" },
  brands: { changefreq: "monthly", priority: "0.6" },
  guides: { changefreq: "monthly", priority: "0.6" },
  about: { changefreq: "monthly", priority: "0.6" },
  contact: { changefreq: "monthly", priority: "0.7" },
  survey: { changefreq: "monthly", priority: "0.7" },
  pricing: { changefreq: "monthly", priority: "0.7" },
  "how-it-works": { changefreq: "monthly", priority: "0.6" },
  faqs: { changefreq: "monthly", priority: "0.6" },
  privacy: { changefreq: "yearly", priority: "0.3" },
  terms: { changefreq: "yearly", priority: "0.3" },
  cookies: { changefreq: "yearly", priority: "0.3" },
};

const EXCLUDED_PATHS = new Set(["/thank-you/"]);

function pathFromGlobKey(key: string): string {
  let p = key.replace(/^\.\//, "").replace(/\.astro$/, "");
  if (p === "index") return "/";
  if (p.endsWith("/index")) p = p.slice(0, -"/index".length);
  return `/${p}/`;
}

function metaFor(path: string): { changefreq: string; priority: string } {
  const section = path.split("/").filter(Boolean)[0] ?? "";
  return SECTION_META[section] ?? { changefreq: "monthly", priority: "0.5" };
}

export const GET = async (): Promise<Response> => {
  const BASE = "https://installmybathroom.co.uk";
  const pageModules = import.meta.glob("./**/*.astro");

  const urls = Object.keys(pageModules)
    .map(pathFromGlobKey)
    .filter((p) => !EXCLUDED_PATHS.has(p))
    .sort();

  const lines = urls.map((path) => {
    const { changefreq, priority } = metaFor(path);
    return `  <url>\n    <loc>${BASE}${path}</loc>\n    <lastmod>${BUILD_DATE}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join("\n")}\n</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
};
