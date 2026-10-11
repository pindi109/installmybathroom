export const meta = {
  name: 'imb-phase1-content',
  description: 'IMB full build Phase 1: 23 per-town agents (3 pages each) + 7 keyword-led guide agents',
  phases: [
    { title: 'Town pages', detail: '23 towns x (survey, cost, brands-in-area)' },
    { title: 'Guide pages', detail: '6 remaining keyword-led cost/checklist guides' },
  ],
}

const payload = typeof args === 'string' ? JSON.parse(args) : args
const TOWNS = payload.towns
const GUIDES = payload.guides
const REPO = '/home/pindi/installmybathroom'

const TOWN_IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    town: { type: 'string' },
    surveyHeroAlt: { type: 'string' },
    costHeroAlt: { type: 'string' },
    brandsHeroAlt: { type: 'string' },
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          outputPath: { type: 'string' },
          prompt: { type: 'string' },
          aspectRatio: { type: 'string' },
          targetWidth: { type: 'number' },
          targetHeight: { type: 'number' },
        },
        required: ['outputPath', 'prompt', 'aspectRatio', 'targetWidth', 'targetHeight'],
      },
    },
  },
  required: ['town', 'surveyHeroAlt', 'costHeroAlt', 'brandsHeroAlt', 'images'],
}

function townPrompt(town) {
  return `You are writing real content for a UK luxury bathroom installation company's website (Install My Bathroom, installmybathroom.co.uk). This is one town out of 23 in a larger build — ${town.name}.

Read these two files first, they are mandatory:
- ${REPO}/build-plan/CONTENT-SCHEMA.md (the exact JSON contract you must follow)
- ${REPO}/build-plan/IMAGE-CONSTRAINTS.md (mandatory image prompt discipline)

Also read ${REPO}/src/data/towns.json and find the entry for "${town.slug}" for the real, sourced facts about this town (housing stock, nearby towns). Do NOT invent any other facts about this town. Business facts you may use: fit-only installation from £3,500, £125 survey, 30 years' experience, repairs from £200 (emergency call-out £500 minimum, no regrouting), based in Bracknell. Never mention Install My Kitchen, IMK, Berkshire Bespoke, BBB, BBC, or any invented review/testimonial/award.

Write THREE content JSON files, each following the schema exactly:

1. ${REPO}/src/content/generated/survey-town/${town.slug}.json
   - path: "/survey/${town.slug}/"
   - family: "Per-town: survey"
   - What the £125 survey covers (general) + what it looks like in a typical ${town.name} property (using the real housing-stock fact from towns.json)
   - internalLinks: [{href:"/survey/",anchor:"..."}, {href:"/areas/${town.slug}/",anchor:"..."}, {href:"/bathroom-cost/${town.slug}/",anchor:"..."}]
   - At least 3 FAQs, at least 700 words of real body content across hero.intro + sections + faqs (this is a hard minimum, check your own word count before finishing)

2. ${REPO}/src/content/generated/cost-town/${town.slug}.json
   - path: "/bathroom-cost/${town.slug}/"
   - family: "Per-town: cost"
   - Install price ranges from £3,500, what changes cost (reuse the general cost-driver logic: moved waste, wet room vs tray, natural stone vs porcelain — do NOT invent new numbers), a repairs pricing line (from £200, £500 emergency minimum), and how ${town.name}'s housing stock (from the real fact) tends to affect typical specification
   - internalLinks: [{href:"/guides/how-much-does-a-luxury-bathroom-installation-cost-uk/",anchor:"..."}, {href:"/pricing/",anchor:"..."}, {href:"/areas/${town.slug}/",anchor:"..."}]
   - At least 3 FAQs, at least 700 words total

3. ${REPO}/src/content/generated/brands-in-area/${town.slug}.json
   - path: "/areas-brands/${town.slug}/"
   - family: "Per-town: brands in area"
   - The fit-only model explained, brands IMB fits (reference the real brand list from src/data/brands.json, don't invent brands)
   - internalLinks: [{href:"/brands/",anchor:"..."}, {href:"/areas/${town.slug}/",anchor:"..."}] — do NOT link to /installer/ pages, they don't exist yet
   - At least 3 FAQs, at least 700 words total

Each of the 3 pages must read as genuinely distinct content about ${town.name} — not the same paragraph three times with a different heading. Each needs its own unique seo.title/description, h1, primaryKeyword or set. generatedAt: "2026-10-07", templateVersion: "v1".

For each of the 3 pages, also write a fully bespoke, unique hero image prompt (6-part structure per IMAGE-CONSTRAINTS.md) — survey page hero should depict a survey/measuring moment (tape measure, clipboard, pre-work room), cost page hero should depict a finished high-spec bathroom scene reflecting ${town.name}'s housing character, brands page hero should depict a close/mid vanity or fixture detail shot implying brand choice. Vary material palette and metal finish across the 3 so they don't look like the same room. outputPath values: "heroes/survey-town/${town.slug}-hero.webp", "heroes/cost-town/${town.slug}-hero.webp", "heroes/brands-in-area/${town.slug}-hero.webp". All 16:9, targetWidth 1834, targetHeight 1024.

Each JSON file also needs an "image" field: {"heroPrompt": "...", "heroOutputPath": "...", "heroAlt": "...", "inline": []}.

When all 3 files are written, call your StructuredOutput tool with: town slug, the 3 hero alt texts (surveyHeroAlt, costHeroAlt, brandsHeroAlt — must exactly match what you put in each JSON's image.heroAlt), and the images array (the 3 hero image job specs, matching exactly what you put in each JSON's image.heroPrompt/heroOutputPath).`
}

const townResults = await pipeline(
  TOWNS,
  (town) => agent(townPrompt(town), { phase: 'Town pages', label: `town:${town.slug}`, schema: TOWN_IMAGE_SCHEMA })
)

log(`Town pages done: ${townResults.filter(Boolean).length}/${TOWNS.length}`)

const GUIDE_IMAGE_SCHEMA = {
  type: 'object',
  properties: {
    slug: { type: 'string' },
    guideName: { type: 'string' },
    images: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          outputPath: { type: 'string' },
          prompt: { type: 'string' },
          aspectRatio: { type: 'string' },
          targetWidth: { type: 'number' },
          targetHeight: { type: 'number' },
        },
        required: ['outputPath', 'prompt', 'aspectRatio', 'targetWidth', 'targetHeight'],
      },
    },
  },
  required: ['slug', 'guideName', 'images'],
}

function guidePrompt(g) {
  return `You are writing a new guide page for installmybathroom.co.uk, a UK luxury fit-only bathroom installation company's website.

First, Read ${REPO}/src/pages/guides/walk-in-shower-cost-uk.astro in full — this is the exact structural and tonal pattern to follow (direct-answer box, cost-driver table, scenario section with inline image, 2-image grid, a topic-specific extra section, Areas served section via {areasData.tier1.map(...)}, "what's included in fit-only price" section, Sources and standards, FAQ section with 7-8 items, Related links, Author/date). Match this structure exactly, adapted to this guide's own topic.

Also Read ${REPO}/build-plan/IMAGE-CONSTRAINTS.md for mandatory image prompt discipline.

Topic: "${g.title}"
Target keywords (do not force all of them unnaturally, just cover the real intent): ${g.keywords}
Business facts you may use: fit-only installation from £3,500, £125 survey, 30 years' experience, repairs from £200 (emergency call-out £500 minimum, no regrouting), based in Bracknell. Never mention Install My Kitchen, IMK, Berkshire Bespoke, BBB, BBC, or invented reviews/awards. Pick ONE distinct colour palette for this guide's images (e.g. warm travertine, cool grey stone, deep green marble, warm brass+walnut) — different from anthracite/black/navy/stone-grey/walnut-brown/dark-grey already used on the 6 existing cost guides.

Write the complete file at ${REPO}/src/pages/guides/${g.slug}.astro — a full, real Astro page, at least 1,600 words of body content, matching the reference file's imports and component usage exactly (Base, Header, Footer, StickyMobileCTA, Breadcrumbs, FAQ, business config, areasData). Use real cost logic consistent with the existing cost guides (don't invent contradictory numbers) if this is a cost-type page.

Write 1 hero image (1834x1024, 16:9) + 3 inline images (800x600, 4:3), each with a fully bespoke unique prompt per IMAGE-CONSTRAINTS.md — no two images anywhere in this build should share a prompt template. Hero outputPath: "heroes/guides/${g.slug}-hero.webp". Inline outputPaths: "inline/${g.slug}-{your-own-descriptive-suffix}.webp" (pick 3 distinct descriptive suffixes).

When the .astro file is fully written, call StructuredOutput with: slug, guideName (the display name for the guides hub, e.g. "Bathroom Tiling Cost UK"), and the images array (4 entries: 1 hero + 3 inline).`
}

const guideResults = await pipeline(
  GUIDES,
  (g) => agent(guidePrompt(g), { phase: 'Guide pages', label: `guide:${g.slug}`, schema: GUIDE_IMAGE_SCHEMA })
)

log(`Guide pages done: ${guideResults.filter(Boolean).length}/${GUIDES.length}`)

return { townResults, guideResults }
