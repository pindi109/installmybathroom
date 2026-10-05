/**
 * IndexNow submission — runs as a post-build step (see package.json "build" script).
 * Walks dist/ for every *.html page, builds the live URL list, and POSTs it to
 * IndexNow so Bing (and other participating engines) can pick up new/changed
 * pages without waiting for a crawl. Resubmitting unchanged URLs is harmless
 * per the IndexNow spec, so this runs the full list on every build rather than
 * tracking a diff.
 *
 * Only runs in Netlify's production build context — skipped locally and on
 * deploy previews so it never submits a non-canonical host.
 */
import { readdirSync, statSync, existsSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DIST = join(ROOT, "dist");
const PUBLIC_DIR = join(ROOT, "public");
const SITE = "https://installmybathroom.co.uk";
const HOST = "installmybathroom.co.uk";

// Pages that exist but shouldn't be offered to search engines.
const EXCLUDE_PATHS = new Set(["/thank-you/", "/netlify-forms.html"]);

function isProductionBuild() {
  // Netlify sets CONTEXT=production only for the main branch; deploy previews
  // and branch deploys get "deploy-preview" / "branch-deploy".
  return process.env.CONTEXT === "production";
}

function findIndexNowKey() {
  const file = readdirSync(PUBLIC_DIR).find((f) => /^[0-9a-f]{32}\.txt$/i.test(f));
  if (!file) return null;
  return { key: file.replace(/\.txt$/, ""), file };
}

function collectHtmlUrls(dir) {
  const urls = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      urls.push(...collectHtmlUrls(full));
    } else if (entry === "index.html") {
      const relDir = relative(DIST, dirname(full)).split("\\").join("/");
      urls.push(relDir === "" ? "/" : `/${relDir}/`);
    }
  }
  return urls;
}

async function main() {
  if (!isProductionBuild()) {
    console.log("[indexnow] skipped — not a production build (CONTEXT != production)");
    return;
  }

  if (!existsSync(DIST)) {
    console.log("[indexnow] skipped — dist/ not found, build may have failed");
    return;
  }

  const keyInfo = findIndexNowKey();
  if (!keyInfo) {
    console.log("[indexnow] skipped — no IndexNow key file found in public/");
    return;
  }

  const rawPaths = collectHtmlUrls(DIST)
    .filter((p, i, arr) => arr.indexOf(p) === i)
    .filter((p) => !EXCLUDE_PATHS.has(p));

  const urlList = rawPaths.map((p) => `${SITE}${p}`);

  if (urlList.length === 0) {
    console.log("[indexnow] skipped — no URLs collected");
    return;
  }

  const body = {
    host: HOST,
    key: keyInfo.key,
    keyLocation: `${SITE}/${keyInfo.file}`,
    urlList,
  };

  console.log(`[indexnow] submitting ${urlList.length} URLs...`);

  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });
    console.log(`[indexnow] response: ${res.status} ${res.statusText}`);
  } catch (err) {
    // Never fail the build over this — it's a notify-only side effect.
    console.error(`[indexnow] request failed (non-fatal): ${err.message}`);
  }
}

main();
