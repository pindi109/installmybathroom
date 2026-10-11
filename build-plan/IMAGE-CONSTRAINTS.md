# Image prompt discipline (every image, every page)

Every single image prompt across this entire build must be individually hand-written and unique — never a shared template string with only the town/brand name substituted. A reused template across dozens of pages is an immediate site-quality failure, not a minor issue.

## Required 6-part structure

1. **Purpose** — what this image is for (hero vs inline supporting shot, which page/topic)
2. **Subject and action** — the specific fixture/scene, what's happening in it
3. **Setting and work-stage** — finished room vs construction-stage, room type, time of day/light source
4. **Composition** — camera angle, framing, what fills the foreground/background
5. **Light and materials** — specific material (which stone/timber/metal finish), specific light sources, how they interact (uneven, mixed, directional — not flat)
6. **Constraints** — the anti-AI-tell list below, plus "no people, no text, no logos, no brand names visible on fixtures"

## Anti-AI-tell constraints (append to every prompt's Constraints clause)

Do not ask for "photorealistic" alone — name the specific failure modes to avoid, every time:
- No LED light strips under every shelf, niche, mirror or floor edge simultaneously — real bathrooms don't backlight every junction at once.
- No catalog-symmetrical staging — no twin mirrors/twin basins unless genuinely a double vanity, no perfectly centred everything.
- No single uniform amber/gold colour wash across the whole frame — light should fall unevenly (mixing daylight + one or two practical fixtures, not ambient glow everywhere).
- No hanging ferns, potted trees, floral arrangements or arranged candles as styling props.
- No shower/tap shown actively running water while the rest of the scene is dry-styled with candles/florals (physically inconsistent).
- No uniform hyper-gloss on every surface — real materials have varied sheen and minor, believable wear.

## Variety requirement across a batch

When generating many images for the same family (e.g. 23 town survey-page heroes), vary deliberately across these axes so no two heroes in the same family read as the same room with a name swapped:
- Material palette (at minimum rotate through: Calacatta/Carrara marble, travertine, honed limestone, dark basalt/anthracite stone, warm walnut timber accents)
- Metal finish (brushed brass, brushed bronze, matte black, brushed nickel, brushed chrome)
- Camera composition (wide room shot from doorway, three-quarter angle, close-to-fixture mid shot)
- Time of day / light quality (bright midday daylight, soft overcast light, warm evening light with one practical fixture)

Reuse the exact color-per-topic discipline already proven on the 6 cost guides built earlier this session (one distinct palette per page, not per family) where the family is small enough (Phase 1's 3 per-town families × 23 towns = 69 pages) — for families this size, prefer rotating through a fixed palette of ~6-8 combinations rather than inventing 69 entirely distinct ones, but ensure no two *adjacent* pages in the generation order share the same combination.
