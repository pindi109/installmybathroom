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

## Phase 2 — DONE (2026-10-14)

210/210 rows in `imb-url-plan.csv` validated:
- Brand × town (126: 18 brands × 7 priority towns, `/installer/{brand}-{town}/`)
- Service × town (84: 12 services × same 7 priority towns, `/areas/{town}/{service}/`)
Priority towns: ascot, gerrards-cross, stoke-poges, sunningdale, virginia-water,
wentworth-estate, windsor.

History: the build session crashed mid-way through content generation (a 30-agent fan-out:
18 brand-writers + 12 service-writers). 88/210 pages existed on disk when the next session
started (79 brand-town, 9 service-town), reconstructed from disk + the dead session's
`.jsonl` transcript. Resumed by dispatching one agent per remaining brand/service (22 agents
covering the exact gap — some brands/services were fully missing, others partially done) to
write only the missing files; one agent (large-format-porcelain-tiling) failed mid-stream on
an API error with zero files written and was relaunched standalone.

Fixed during recovery:
- 3 agents (TOTO, Victoria + Albert, and partial runs across Bette/Duravit/Kaldewei/Laufen —
  29 files total) wrote `internalLinks` using a `url` key instead of the schema's `href` key;
  2 service-town families (accessible-luxury-bathrooms, natural-stone-and-marble-bathrooms —
  14 files) used a `path` key instead. Both would have rendered as broken `<a href="undefined">`
  links in production, not just failed the validator. Fixed mechanically across all 43 files,
  rebuilt, re-validated clean.
- Full validator run (all families, 279 content files): 0 failures, 211 pass, 68 warn
  (word-count warnings only, 538-699 words — all above the 500-word hard-fail floor).
  `brand-town` alone: 126 validated, 0 fail, 31 warn. `service-town` alone: 84 validated,
  0 fail, 37 warn.
- `npx astro build`: 401 pages built clean (191 pre-Phase-2 + 210 new).
- `/sitemap.xml`: confirmed all 126 `/installer/` URLs and 84 `/areas/{town}/{service}/` URLs
  present.

**Not yet done (deliberately out of scope for this pass, per the build spec's phase gates):**
no images generated for any of the 210 pages; nothing committed to git (`imb-url-plan.csv`
status + this file are the only changes alongside the 210 new content JSON files — all
untracked, awaiting explicit human review/commit per [[feedback_no_unattended_automation]]);
the word-count warnings (31 + 37) haven't been individually reviewed/tightened, since they're
warn not fail; the Phase 1 "brands in area" pages still link to `/brands/{brand}/` hub pages
instead of the now-existing `/installer/{brand}-{town}/` pages — this upgrade (noted as
pending since Phase 1) can now actually happen, since the installer pages exist.

## Phase 3–5 — NOT STARTED

See `IMB_FULL_BUILD_SPEC.md` §6 and `imb-url-plan.csv` (Phase column) — 1,221 more pages:
brand/service × all towns at larger scale, LLM/question/answer/comparison content families,
repair pages.
