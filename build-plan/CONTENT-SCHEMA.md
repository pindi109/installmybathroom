# Content JSON contract

Applies to all "templated family" pages (one Astro route + `getStaticPaths()` per family, one JSON content file per page). Hand-written one-off pages (the 7 remaining Keyword-led content guides, and every hub page — `/repairs/`, `/products/`, `/questions/`, etc.) are flat `.astro` files like the existing 32 guides, NOT part of this JSON pipeline — a repeating family is what benefits from schema + template; a single bespoke page does not.

## Storage

`src/content/generated/{family}/{slug}.json`

Phase 1 families (the only ones built so far):
- `survey-town/{town}.json` → route `/survey/{town}/`
- `cost-town/{town}.json` → route `/bathroom-cost/{town}/`
- `brands-in-area/{town}.json` → route `/areas-brands/{town}/`

Later-phase families (designed now for consistency, not yet populated): `brand-town`, `service-town`, `repair-town`, `repair-type`, `product-install`, `content-questions`, `content-answers`, `content-comparisons`, `content-cost`, `content-problem`, `content-llm`.

## Schema

```json
{
  "path": "/survey/ascot/",
  "family": "Per-town: survey",
  "town": "ascot",
  "seo": { "title": "", "description": "", "canonical": "https://installmybathroom.co.uk/survey/ascot/" },
  "h1": "",
  "hero": { "intro": "" },
  "sections": [{ "heading": "", "body": "" }],
  "faqs": [{ "q": "", "a": "" }],
  "internalLinks": [{ "href": "", "anchor": "" }],
  "factsUsed": [{ "file": "towns.json", "id": "ascot" }],
  "primaryKeyword": "",
  "secondaryKeywords": [],
  "generatedAt": "2026-10-07",
  "templateVersion": "v1",
  "image": {
    "heroPrompt": "",
    "heroOutputPath": "heroes/survey-town/ascot-hero.webp",
    "heroAlt": "",
    "inline": [
      { "prompt": "", "outputPath": "inline/survey-ascot-{descriptor}.webp", "alt": "" }
    ]
  }
}
```

`image` is an addition beyond the spec's base contract, needed because this build includes images (per explicit confirmation). `heroPrompt`/inline `prompt` must each be a unique, fully-specified single-image prompt (6-part structure: Purpose, Subject+action, Setting+work-stage, Composition, Light+materials, Constraints) — no shared template string with only the town/brand name swapped in. See `build-plan/IMAGE-CONSTRAINTS.md`.

Every local/business claim in `sections[].body` or `faqs[].a` must trace to an entry in `factsUsed`. If no fact exists in `towns.json`/`brands.json`/`repairs.json`/`products.json`/`services.json`, omit the claim — do not invent.

## Required sections/links per Phase-1 family (spec §5)

| Family | Required sections | Required links |
|---|---|---|
| Per-town: survey | what the £125 survey covers; what happens in that town's typical property types (facts only); booking CTA | `/survey/`, `/areas/{town}/`, `/bathroom-cost/{town}/` |
| Per-town: cost | install price ranges from £3,500; what changes cost; repair pricing line | cost guides, `/pricing/`, `/areas/{town}/` |
| Per-town: brands in area | brands IMB fits; fit-only model explained | all `/installer/{brand}-{town}/` for that town (not yet built — Phase 2/3; link added once those pages exist), `/brands/` |

**Note:** "Per-town: brands in area" pages reference `/installer/{brand}-{town}/` URLs that don't exist until Phase 2/3. For Phase 1, these pages link to `/brands/{brand}/` (the existing brand hub pages) instead, with a note in each JSON file's `notes` field — will be upgraded to link to the specific `/installer/{brand}-{town}/` page once Phase 2/3 builds it, same pattern as the brief's own incremental-phase design.

## Canonical rule (spec §5)

`/areas/{town}/` owns "bathroom fitter {town}" intent. None of the Phase-1 families target that phrase as a primary keyword.
