# IMB Full Build — Progress Log

## Phase 1 — DONE (2026-10-11)

82/82 rows in `imb-url-plan.csv` validated:
- 69 per-town pages (survey/cost/brands-in-area × 23 towns)
- 13 keyword-led guides (6 pre-existing before this build spec existed, 7 written in this phase: `bathroom-plumber-cost-uk`, `bathroom-renovation-planning-checklist`, `basin-and-vanity-unit-installation-cost-uk`, `extractor-fan-installation-cost-uk`, `bathroom-tiling-cost-uk`, `shower-screen-installation-cost-uk`, `bathroom-cost-calculator`)

History: the original build session crashed mid-way through content generation (93 agents:
23 town-writers + 6 guide-writers). A second session also crashed before recovery. Recovered
by reconstructing state from disk + the dead session's `.jsonl` transcript — found 2 towns
(Winkfield, Winkfield Row) still missing content and all 93 images ungenerated.

Fixed during recovery:
- Wrote the 2 missing towns' content (4 files).
- `scripts/validate-generated.mjs` flagged 7 `cost-town` pages failing body-similarity
  (near-duplicate "Fit-only bathroom installation in X starts from £3,500..." openings) —
  rewrote in same-cluster batches (not independently) anchored on each town's real fact
  instead of the shared price boilerplate. Re-validated clean: 69/69 pass, 0 warn, 0 fail.
- Generated all 93 images (`scripts/generate-single-images.mjs`, fal-ai/nano-banana-pro, real
  spend) — 69 town heroes + 6 guide heroes + 18 guide inlines, 0 failures, spot-checked
  visually.
- Added the 6 new guides' hero entries to `public/hero-manifest.json` + `src/data/alt-tags.json`
  (town-page heroes don't need this — those templates read `image.heroOutputPath` directly off
  the content JSON).
- Added all 6 new guides to `src/data/guides.json` (hub listing) — none were in it.

Committed `ea7e267`, pushed to `main`, Netlify auto-deployed (site is git-connected,
`build_settings.provider: github`). Live URLs spot-checked (200 OK). IndexNow submission
confirmed (190/190 URLs, 200 OK).

**Known follow-up, not yet done:** the Phase 1 "brands in area" pages link to `/brands/{brand}/`
hub pages instead of `/installer/{brand}-{town}/` (per `CONTENT-SCHEMA.md`'s documented
Phase-1 placeholder note) — upgrade those links once Phase 2 builds the installer pages.

## Phase 2 — NOT STARTED

210 pages: Brand × town (126: 18 brands × 7 priority towns, `/installer/{brand}-{town}/`) +
Service × town (84: 12 services × same 7 priority towns, `/areas/{town}/{service}/`).
Priority towns: ascot, gerrards-cross, stoke-poges, sunningdale, virginia-water,
wentworth-estate, windsor.

## Phase 3–5 — NOT STARTED

See `IMB_FULL_BUILD_SPEC.md` §6 and `imb-url-plan.csv` (Phase column) — 1,221 more pages:
brand/service × all towns at larger scale, LLM/question/answer/comparison content families,
repair pages.
