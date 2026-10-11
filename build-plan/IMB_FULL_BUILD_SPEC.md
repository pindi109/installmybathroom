# IMB FULL BUILD — 1,651 NEW PAGES, PHASES 1–5, NO DEPLOY

Site: installmybathroom.co.uk
Goal: build every URL in `build-plan/imb-url-plan.csv` (1,651 rows) into the existing site source, phase by phase, back to back, with a local production build and validation after every batch.

**Absolute rules**
- NEVER deploy. NEVER `git push`. NEVER call Netlify. Commit locally only. Deployment is done by Pindi manually.
- NEVER modify, rename, or shadow the 106 existing URLs. If a planned URL collides with an existing route, skip it and log it.
- Resumable: all progress lives in `build-plan/imb-url-plan.csv` (`status` column) and `build-plan/PROGRESS.md`. A new session must be able to continue from where the last one stopped.

---

## 0. Inputs (copy into the repo first)

```
build-plan/imb-url-plan.csv        # 1,651 rows: path, URL, Family, Phase, Town, Priority Town, Dimension, Tier, Notes, status
build-plan/imb-keyword-master.csv  # 2,147 keywords: keep/drop, cluster, page type, canonical target, primary/secondary
build-plan/imb-repair-keywords.csv # 62 repair keywords mapped to repair pages
```

`status` values: `todo` → `written` → `validated` (or `skipped` / `failed` with a reason in `build-plan/PROGRESS.md`).

---

## 1. Inspection first (no code changes)

Inspect the repo and write `build-plan/INSPECTION.md` covering:
- framework and version (expected Astro, verify), build command, output dir
- how existing pages are built: layouts, components, `business.ts` (or equivalent), services/brands/areas data files
- how `/sitemap.xml` is generated (it is a single urlset listing all pages, verify), robots, canonical, JSON-LD, breadcrumbs, FAQ component
- existing route patterns for `/areas/[town]/`, `/services/`, `/brands/`, `/guides/`
- any route that would collide with: `/areas/{town}/{service}/`, `/installer/`, `/repairs/`, `/products/`, `/survey/{town}/`, `/bathroom-cost/{town}/`, `/areas-brands/{town}/`, `/questions/`, `/answers/`, `/comparisons/`, `/cost/`, `/problem/`, `/llm/`, `/bathroom-cost-calculator/`

**Material conflict (e.g. `/areas/[town].astro` cannot take a nested `[service]` route without breaking existing pages) → STOP and report.** Minor naming differences: adapt and note in INSPECTION.md.

---

## 2. Business facts (single source of truth)

Create or extend the site's existing business data file. These are the ONLY business claims allowed in generated content:

| Fact | Value |
|---|---|
| Brand | Install My Bathroom (IMB) — standalone business |
| Legal | Sole trader, no company number |
| Phone / WhatsApp | 07399 651836 |
| Base | Bracknell RG42 4GL — **no street address anywhere** |
| Experience | 30 years installing high-end bathrooms |
| Model | Fit-only: client buys their own products, IMB installs. Supplier/brand links are non-affiliate, open in new tab |
| Survey | £125 paid survey (not every project starts with one) |
| Installs | From £3,500 |
| Repairs | High-end homes only. Minimum £200 (e.g. shower-tray resealing from £200). Emergency call-out minimum £500 (leaks, blocked toilets). **No regrouting.** Includes leaking taps and extractor fans |
| Reviews | None yet. No testimonials, ratings, review counts or `AggregateRating` schema |

**Banned in all output** (hard fail): `Future Build`, `Install My Kitchen`, `IMK`, `Berkshire Bespoke`, `BBB`, `BBC`, `installmykitchen`, `berkshirebespoke`, `12311977`, `Holbrook Lane`, any street address, any invented review/testimonial/award/accreditation/certification/years-in-town/project count/employee/office.

Pricing tone: state prices plainly and justify by quality (30 years, high-end homes, insured work). Never compare to competitor prices.

---

## 3. Dimension data files

Create in the site's data directory (match existing conventions):

- `towns.json` — the 23 towns from `/areas/`. Per town: slug, name, priority flag, nearby towns (from the existing area pages), and `facts[]` **copied only from the existing hand-written area page or reliable sources with `source_url`**. No fact without a source. Priority towns: sunningdale, gerrards-cross, stoke-poges, ascot, windsor, virginia-water, wentworth-estate.
- `brands.json` — the 18 brands from `/brands/`. Facts taken from the existing brand pages only.
- `services.json` — reuse the existing services data if present; add `core: true` for: full-bathroom-installation, ensuite-installation, wet-room-installation, walk-in-shower-installation, cloakroom-and-wc-installation, shower-toilet-installation, steam-shower-and-steam-room-installation, freestanding-bath-installation, natural-stone-and-marble-bathrooms, large-format-porcelain-tiling, accessible-luxury-bathrooms, underfloor-heating-installation.
- `repairs.json` — 16 types: leaking-shower-repair, leaking-toilet-repair, blocked-toilet, concealed-cistern-repair, wall-hung-toilet-repair, shower-valve-repair, digital-shower-repair, shower-toilet-repair, steam-shower-repair, wet-room-leak-repair, bathroom-tile-repair, shower-tray-resealing, underfloor-heating-repair, extractor-fan-repair, bathroom-waste-and-drain-repair, leaking-tap-repair. Each: `emergency: true|false`, price line (`from £200` or `emergency call-out £500 minimum`).
- `products.json` — the 30 product slugs in the URL plan (Family = Product install).

Facts are data. Prose is written per page. Never store reusable marketing paragraphs.

---

## 4. Content storage and routes

- One JSON content file per page, e.g. `src/content/generated/{family}/{slug}.json` (adapt to repo). Validate every file against a strict schema (zod or the repo's existing validator).
- One template/route per family, all static (`getStaticPaths` or equivalent). No runtime API, DB or LLM calls.
- Reuse existing layout, header, footer, breadcrumbs, FAQ component, CTA, chat agent, WhatsApp button, styles. No redesign.
- New pages must appear in `/sitemap.xml` via the existing mechanism. Do not hand-maintain a second sitemap.

### Content JSON contract (minimum)
```json
{
  "path": "/installer/geberit-ascot/",
  "family": "Brand × town",
  "seo": { "title": "", "description": "", "canonical": "https://installmybathroom.co.uk/installer/geberit-ascot/" },
  "h1": "",
  "hero": { "intro": "" },
  "sections": [{ "heading": "", "body": "" }],
  "faqs": [{ "q": "", "a": "" }],
  "internalLinks": [{ "href": "", "anchor": "" }],
  "factsUsed": [{ "file": "towns.json", "id": "" }],
  "primaryKeyword": "",
  "secondaryKeywords": [],
  "generatedAt": "",
  "templateVersion": "v1"
}
```
Every local or business claim in prose must trace to an entry in `factsUsed`. If no fact exists, omit the claim.

---

## 5. Page family requirements

| Family | Required sections | Required links |
|---|---|---|
| Keyword-led content (13) | Per keyword cluster in `imb-keyword-master.csv`; cost guides give ranges with what drives cost; calculator is a working static JS tool | parent service, /pricing/, /survey/ |
| Per-town: survey | what the £125 survey covers, what happens in that town's typical property types (facts only), booking CTA | /survey/, /areas/{town}/, /bathroom-cost/{town}/ |
| Per-town: cost | install price ranges from £3,500, what changes cost, repair pricing line | cost guides, /pricing/, /areas/{town}/ |
| Per-town: brands in area | brands IMB fits, fit-only model explained | all /installer/{brand}-{town}/ for that town, /brands/ |
| Brand × town | brand facts, what IMB installs from that brand, installation considerations for that brand, town context (facts only), process, CTA, FAQ | /brands/{brand}/, /areas/{town}/, /areas-brands/{town}/, 2+ relevant services |
| Service × town | service specifics, how town/property context affects this service (facts only), installation considerations, process, CTA, FAQ | /services/{service}/, /areas/{town}/, related cost guide, 2 neighbouring towns' same service |
| Repairs hub / repair type | what's covered, pricing (from £200 / £500 emergency), high-end homes only, no regrouting | repair × priority towns, emergency hub |
| Repair × town | the repair, causes, what IMB does, pricing line, town context (facts only), contact CTA | repair type page, /areas/{town}/, /emergency-bathroom-repairs/ |
| Product install | what the product is, installation requirements, common install mistakes, compatible brands (from brands.json), CTA | relevant service, brand pages, guides |
| Content families (180 TBD) | see §6 | parent hub + 2+ relevant service/guide pages |

**Canonical rule:** `/areas/{town}/` owns "bathroom fitter {town}". No new page may target that intent. Service × town pages target "{service} {town}" only.

**Uniqueness rule:** every page is written for its specific combination. No template paragraph with the town/brand name swapped. The validator enforces this (§7).

---

## 6. Content families (Phase 3)

The 180 `TBD-nn` rows have no topics yet. Before writing them:
1. Derive topics from `imb-keyword-master.csv` (kept keywords of intent `informational`/`commercial` not already owned by an existing page), `imb-repair-keywords.csv`, and bathroom-installation knowledge.
2. Write `build-plan/content-topics.csv` (family, slug, title, primary keyword, why it is not a duplicate of an existing page).
3. Replace each `TBD-nn` path with the real slug in `imb-url-plan.csv`.
4. Dedupe against all existing and planned URLs. Fewer than the target count is fine — never pad.

---

## 7. Validator (deterministic, run after every batch)

Script: `scripts/validate-generated.(mjs|py)` — reads all generated JSON + built HTML.

| Check | Fail | Warn |
|---|---|---|
| Schema valid | invalid | — |
| Route collision with existing/planned URL | any | — |
| Title / H1 exact duplicate (site-wide) | any | similarity ≥ 0.85 |
| Meta description | — | similarity ≥ 0.85 |
| Body similarity (5-word shingle Jaccard) vs every page in same family and vs parent pages | ≥ 0.70 | 0.50–0.70 |
| Banned terms (§2) | any | — |
| Review/rating schema or testimonial text | any | — |
| Claims with numbers, years, "listed", "conservation", street names not in `factsUsed` | — | any (log for review) |
| Primary keyword exact-phrase density | > 3% | > 2% |
| Body word count | < 500 | < 700 |
| Required sections/FAQs/links present | missing | — |
| Internal links resolve in build output | broken | — |
| Canonical = intended URL | mismatch | — |
| JSON-LD parses; no AggregateRating/Review | invalid | — |

Thresholds live in a config file, not in code. Similarity is measured within the same family because that is where swap-in duplication happens.

Write results to `build-plan/reports/phase{N}-batch{M}.json`. A failed page goes back to `todo` and is rewritten; after 2 failed rewrites mark it `failed` and move on.

---

## 8. Execution loop

```
for phase in 1..5:
  for batch of 25 rows where Phase == phase and status == todo:
    write content JSON for each row  -> status = written
    run production build             -> must succeed
    run validator                    -> pass rows: status = validated
    update PROGRESS.md (counts, failures, warnings)
    git add -A && git commit -m "IMB phase {phase} batch {M}: {n} pages"   # local only, no push
  at end of phase: full build + full-site validator + summary in PROGRESS.md
```

Order inside each phase: priority towns first, then the rest alphabetically.

If the build breaks: revert the last batch's files (`git reset --hard HEAD`), log the error in PROGRESS.md, fix the template, then retry the batch. Never leave the repo in a non-building state between batches.

---

## 9. Done means

- All 1,651 rows are `validated`, `skipped` (with a reason) or `failed` (with a reason)
- `npm run build` (or the repo's build command) passes
- `/sitemap.xml` in the build output lists every validated URL
- `build-plan/PROGRESS.md` has final counts per family/phase, all warnings, all skipped/failed rows
- Nothing pushed. Nothing deployed.

Final message to Pindi: counts, the exact build command, the local commit range, and the list of warnings needing a human look.
