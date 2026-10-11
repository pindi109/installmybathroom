// Validates every generated content JSON file + the built HTML it produced.
// Run after every batch, per build-plan/IMB_FULL_BUILD_SPEC.md §7.
//
// Usage: node scripts/validate-generated.mjs [--family=survey-town] [--report=build-plan/reports/phase1-batch1.json]
import { readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const CONTENT_DIR = join(REPO_ROOT, "src/content/generated");
const DIST_DIR = join(REPO_ROOT, "dist");

const BANNED_TERMS = [
  "Future Build", "Install My Kitchen", "IMK", "Berkshire Bespoke", "BBB", "BBC",
  "installmykitchen", "berkshirebespoke", "12311977", "Holbrook Lane",
];

const THRESHOLDS = {
  bodySimilarityFail: 0.70,
  bodySimilarityWarn: 0.50,
  titleSimilarityWarn: 0.85,
  keywordDensityFail: 0.03,
  keywordDensityWarn: 0.02,
  wordCountFail: 500,
  wordCountWarn: 700,
};

function args() {
  const out = {};
  for (const a of process.argv.slice(2)) {
    const m = a.match(/^--([a-zA-Z-]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function findAllContentFiles(familyFilter) {
  const families = readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((f) => !familyFilter || f === familyFilter);

  const files = [];
  for (const family of families) {
    const dir = join(CONTENT_DIR, family);
    for (const name of readdirSync(dir)) {
      if (name.endsWith(".json")) files.push({ family, path: join(dir, name), name });
    }
  }
  return files;
}

function bodyText(data) {
  const parts = [
    data.hero?.intro ?? "",
    ...(data.sections ?? []).map((s) => `${s.heading} ${s.body}`),
    ...(data.faqs ?? []).map((f) => `${f.q} ${f.a}`),
  ];
  return parts.join(" ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function shingles(text, n = 5) {
  const words = text.toLowerCase().split(/\s+/).filter(Boolean);
  const out = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    out.add(words.slice(i, i + n).join(" "));
  }
  return out;
}

function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const s of a) if (b.has(s)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function countOccurrences(haystack, needle) {
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (haystack.match(re) ?? []).length;
}

function main() {
  const { family: familyFilter, report: reportPath } = args();
  const files = findAllContentFiles(familyFilter);

  const results = { total: files.length, failed: 0, warned: 0, passed: 0, items: [] };

  // Load all for cross-page similarity checks (within same family + vs parent pages).
  const loaded = files.map((f) => ({
    ...f,
    data: JSON.parse(readFileSync(f.path, "utf-8")),
  }));

  // Build sitemap URL set from dist (if built) for route-collision + broken-link checks.
  let distUrls = null;
  if (existsSync(DIST_DIR)) {
    distUrls = new Set();
    const walk = (dir, base = "") => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(join(dir, entry.name), `${base}/${entry.name}`);
        else if (entry.name === "index.html") distUrls.add(base === "" ? "/" : `${base}/`);
      }
    };
    walk(DIST_DIR);
  }

  const titlesSeen = new Map(); // title -> [slugs]
  const h1sSeen = new Map();

  for (const item of loaded) {
    const { family, name, data } = item;
    const slug = name.replace(/\.json$/, "");
    const issues = { fail: [], warn: [] };

    // Schema: required top-level keys
    const required = ["path", "family", "seo", "h1", "hero", "sections", "faqs", "internalLinks", "factsUsed", "primaryKeyword", "generatedAt", "templateVersion"];
    for (const key of required) {
      if (!(key in data)) issues.fail.push(`missing required field: ${key}`);
    }
    if (!data.seo?.title || !data.seo?.description || !data.seo?.canonical) {
      issues.fail.push("seo.title/description/canonical incomplete");
    }

    // Canonical = intended URL
    if (data.seo?.canonical && data.path && !data.seo.canonical.endsWith(data.path)) {
      issues.fail.push(`canonical mismatch: ${data.seo.canonical} vs path ${data.path}`);
    }

    // Required sections/FAQs present
    if (!Array.isArray(data.sections) || data.sections.length === 0) {
      issues.fail.push("no sections present");
    }
    if (!Array.isArray(data.faqs) || data.faqs.length < 2) {
      issues.fail.push("fewer than 2 FAQs present");
    }
    if (!Array.isArray(data.internalLinks) || data.internalLinks.length === 0) {
      issues.fail.push("no internal links present");
    }

    // Banned terms
    const fullText = JSON.stringify(data);
    for (const term of BANNED_TERMS) {
      if (fullText.toLowerCase().includes(term.toLowerCase())) {
        issues.fail.push(`banned term present: "${term}"`);
      }
    }

    // Review/rating schema or testimonial text
    if (/aggregaterating|testimonial|"review"/i.test(fullText)) {
      issues.fail.push("review/rating/testimonial content present");
    }

    // Word count
    const text = bodyText(data);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < THRESHOLDS.wordCountFail) {
      issues.fail.push(`word count ${wordCount} < ${THRESHOLDS.wordCountFail}`);
    } else if (wordCount < THRESHOLDS.wordCountWarn) {
      issues.warn.push(`word count ${wordCount} < ${THRESHOLDS.wordCountWarn}`);
    }

    // Keyword density
    if (data.primaryKeyword) {
      const occurrences = countOccurrences(text, data.primaryKeyword);
      const density = occurrences / Math.max(wordCount, 1);
      if (density > THRESHOLDS.keywordDensityFail) {
        issues.fail.push(`keyword density ${(density * 100).toFixed(1)}% > ${THRESHOLDS.keywordDensityFail * 100}%`);
      } else if (density > THRESHOLDS.keywordDensityWarn) {
        issues.warn.push(`keyword density ${(density * 100).toFixed(1)}% > ${THRESHOLDS.keywordDensityWarn * 100}%`);
      }
    }

    // Title / H1 exact duplicate site-wide (within this validation run)
    const title = data.seo?.title ?? "";
    const h1 = data.h1 ?? "";
    if (titlesSeen.has(title)) {
      issues.fail.push(`exact duplicate title vs ${titlesSeen.get(title)}`);
    } else {
      titlesSeen.set(title, slug);
    }
    if (h1sSeen.has(h1)) {
      issues.fail.push(`exact duplicate H1 vs ${h1sSeen.get(h1)}`);
    } else {
      h1sSeen.set(h1, slug);
    }

    // Body similarity vs every other page in same family (Jaccard on 5-word shingles)
    const mySet = shingles(text);
    for (const other of loaded) {
      if (other === item || other.family !== family) continue;
      const otherText = bodyText(other.data);
      const sim = jaccard(mySet, shingles(otherText));
      if (sim >= THRESHOLDS.bodySimilarityFail) {
        issues.fail.push(`body similarity ${(sim * 100).toFixed(0)}% vs ${other.name} (same family)`);
      } else if (sim >= THRESHOLDS.bodySimilarityWarn) {
        issues.warn.push(`body similarity ${(sim * 100).toFixed(0)}% vs ${other.name} (same family)`);
      }
    }

    // Internal links resolve in build output
    if (distUrls) {
      for (const link of data.internalLinks ?? []) {
        if (!distUrls.has(link.href)) {
          issues.fail.push(`internal link does not resolve: ${link.href}`);
        }
      }
    }

    // Route collision: path must appear in dist
    if (distUrls && !distUrls.has(data.path)) {
      issues.fail.push(`path not found in build output: ${data.path}`);
    }

    const status = issues.fail.length > 0 ? "fail" : issues.warn.length > 0 ? "warn" : "pass";
    if (status === "fail") results.failed++;
    else if (status === "warn") results.warned++;
    else results.passed++;

    results.items.push({ family, slug, status, fail: issues.fail, warn: issues.warn });
  }

  const reportFile = reportPath ?? join(REPO_ROOT, "build-plan/reports/latest.json");
  writeFileSync(reportFile, JSON.stringify(results, null, 2));

  console.log(`\nValidated ${results.total} pages: ${results.passed} pass, ${results.warned} warn, ${results.failed} fail`);
  console.log(`Report written to ${reportFile}\n`);

  for (const item of results.items) {
    if (item.status !== "pass") {
      console.log(`[${item.status.toUpperCase()}] ${item.family}/${item.slug}`);
      for (const f of item.fail) console.log(`  FAIL: ${f}`);
      for (const w of item.warn) console.log(`  warn: ${w}`);
    }
  }

  if (results.failed > 0) process.exitCode = 1;
}

main();
