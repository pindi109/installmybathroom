# INSPECTION — IMB Full Build (1,651 pages)

Date: 2026-10-07

## Framework and build

- Astro 6.4.x, `output: "static"`, no adapter, `trailingSlash: "always"`.
- Build command: `npm run build` (runs `astro build && node scripts/submit-indexnow.mjs`). Output dir: `dist/`.
- No existing dynamic routes anywhere in `src/pages/` — every page today is a flat `.astro` file (confirmed via `find src/pages -iname "*\[*\]*"` returning nothing). This build introduces `getStaticPaths()`-based dynamic routes for the first time in this codebase.
- Tailwind v4 via `@tailwindcss/vite` (CSS-first, no config file, tokens in `src/styles/global.css`).

## Shared layout / components to reuse (no redesign)

- `src/layouts/Base.astro` — single shared layout. Renders `<Header>`, hero image (via `hero-manifest.json` + `alt-tags.json` keyed by URL path, with responsive `srcset` 480w/768w/1200w/1834w), `<BusinessSchema />` (site-wide JSON-LD, sourced from `src/config/business.ts` + `src/data/areas.json`), a `<slot name="schema">` for page-specific JSON-LD, `<slot />` for content, `<Footer>`, `<StickyMobileCTA>`.
- `src/components/Breadcrumbs.astro` — `items: {label, href}[]`, emits `BreadcrumbList` JSON-LD + visible nav.
- `src/components/FAQ.astro` — `items: {q,a}[]`, `schemaId` prop, emits `FAQPage` JSON-LD + accordion markup.
- `src/components/Header.astro` / `Footer.astro` — shared nav, both read `src/data/areas.json` (`priority.slice(0,4)`) for area quick-links.
- `src/components/WhatsAppButton.astro`, `StickyMobileCTA.astro` — reused as-is.
- `src/config/business.ts` — single source of truth: `business` object (name, locality, pricing, phone, etc.) + `entityOneLiner`. **Repairs pricing (£200 min / £500 emergency) does not exist here yet — must be added.**

## Existing data files (`src/data/`)

- `areas.json` — `{tier1: 12 areas, tier2: 11 areas, priority: 13 ranked areas}`. 23 unique area slugs total across tier1+tier2. This is the canonical town list — spec's `towns.json` should match these 23 slugs exactly, not invent new ones.
- `brands.json` — `{slug, name}[]`, 18 entries, matches the 18 `/brands/{slug}/` pages.
- `services.json` — `{slug, name}[]`, 24 entries, matches the 24 `/services/{slug}/` pages. No `core` flag yet — needs adding per spec §3.
- `guides.json` — `{slug, name}[]`, 32 entries (26 original + 6 built this session). Used only by `/guides/` hub page.
- `alt-tags.json`, `hero-manifest.json` — keyed by URL path (e.g. `"areas/ascot"`), used by `Base.astro` for hero image + alt text. New dynamic routes must write into these at build time (or an equivalent per-family manifest) for heroes to render via the existing mechanism, OR new route templates render their own `<img>` directly (bypassing Base's auto-hero) the way `index.astro` and other hand-written pages already sometimes do. **Decision needed per family during route-template build (Phase 1 task).**

## Sitemap, robots, canonical

- `/sitemap.xml` is a **hand-written Astro endpoint** (`src/pages/sitemap.xml.ts`), NOT the `@astrojs/sitemap` plugin (removed earlier this session after a real GSC-fetch bug traced to that plugin's default `sitemap-index.xml` + redirect pattern). It derives URLs via `import.meta.glob("./**/*.astro")` over `src/pages/**/*.astro` — **a `getStaticPaths()`-based dynamic route does NOT appear in this glob** (it's one physical file producing N URLs). **This means Phase 1's new dynamic routes will NOT automatically appear in the sitemap — `sitemap.xml.ts` needs extending to also enumerate the generated content JSON files per family.** This is the single most important finding from this inspection; confirmed by design intent (spec §4: "New pages must appear in /sitemap.xml via the existing mechanism") but requires an actual code change, not a no-op.
- `robots.txt` references `https://installmybathroom.co.uk/sitemap.xml` — no change needed.
- Canonical: each page sets `description` and relies on `Astro.url.href` as canonical by default (`Base.astro`'s `resolvedCanonical`), or an explicit `canonical` prop. New routes must pass the correct canonical explicitly since `Astro.url.href` for a dynamic route still resolves correctly under static output, so no change needed there.

## Route collision check (spec §1, the "STOP and report" gate)

No material conflicts found. Checked every new URL pattern against the current flat-file routes:

| New pattern | Existing route it might collide with | Verdict |
|---|---|---|
| `/areas/{town}/{service}/` (Service × town) | `src/pages/areas/{town}.astro` → `/areas/{town}/` | **Safe.** Different path depth (1 vs 2 segments past `/areas/`); a `src/pages/areas/[town]/[service].astro` file requires both segments present and cannot produce a bare `/areas/{town}/` URL. |
| `/survey/{town}/` | `src/pages/survey/index.astro` → `/survey/` | **Safe.** Index route vs. a new `src/pages/survey/[town].astro` dynamic segment — distinct files, distinct URLs. |
| `/bathroom-cost/{town}/`, `/areas-brands/{town}/`, `/installer/{brand}-{town}/`, `/repairs/...`, `/products/...`, `/questions/`, `/answers/`, `/comparisons/`, `/cost/`, `/problem/`, `/llm/` | None exist today | **Safe.** All brand-new top-level sections. |
| `/guides/{slug}/` (Keyword-led content remainder) | `src/pages/guides/{slug}.astro`, 32 existing flat files | **Safe as long as slugs don't duplicate.** Checked the 7 remaining Keyword-led content slugs (`bathroom-plumber-cost-uk`, `basin-and-vanity-unit-installation-cost-uk`, `extractor-fan-installation-cost-uk`, `bathroom-tiling-cost-uk`, `shower-screen-installation-cost-uk`, `bathroom-renovation-planning-checklist`, plus the standalone `/bathroom-cost-calculator/`) against the existing 32 — no duplicates. |

**No STOP condition triggered.** Proceeding to data files and templates.

## Pre-existing overlap with this build plan

6 of the 13 "Keyword-led content" rows in `imb-url-plan.csv` were already built and deployed in the prior session (before this build spec existed): `walk-in-shower-cost-uk`, `bathroom-building-regulations-and-planning`, `wet-room-cost-uk`, `ensuite-cost-uk`, `bath-installation-cost-uk`, `toilet-installation-cost-uk`. Marked `status: validated` in `imb-url-plan.csv` with a note; not rebuilt. Only the remaining 7 Keyword-led content rows are in scope for Phase 1.

## Repairs — new business line, confirmed intentional

Per explicit user confirmation: Repairs (386 pages across Phases 4–5, plus the pricing facts) is a deliberate new service line, not an accidental scope creep from the spec. `business.ts` will need a `repairs` pricing block added (`fromGBP: 200`, `emergencyCalloutGBP: 500`, `noRegrouting: true`) alongside the existing fit-only installation facts — the two pricing models coexist on the site (installation = whole-project fit-only; repairs = per-callout, high-end-homes-only, with its own minimum).

## Images — confirmed in scope

Per explicit user confirmation, this build includes hero + inline images for every new page (not deferred to a later pass). Given the scale (1,651 pages), this is being executed phase-by-phase with review gates between phases, starting with Phase 1 (82 rows, 76 after removing the 6 pre-built).
