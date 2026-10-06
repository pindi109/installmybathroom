# llms.txt Audit — installmybathroom.co.uk

Source of truth: `src/pages/**/*.astro` directory listing (no sitemap.xml exists yet — that's a pending brief item, not yet built, so the build-output `dist/**/index.html` tree was used as the live-page source instead of a sitemap).

## 1. Every live page URL

107 pages total, confirmed from `dist/**/index.html` after a clean build:

**Core (12):** `/`, `/about/`, `/about/facts/`, `/how-it-works/`, `/pricing/`, `/survey/`, `/contact/`, `/faqs/`, `/privacy/`, `/cookies/`, `/terms/`, `/thank-you/` (noindex)

**Hubs (4):** `/services/`, `/brands/`, `/areas/`, `/guides/`

**Services (24):** full-bathroom-installation, ensuite-installation, wet-room-installation, walk-in-shower-installation, steam-shower-and-steam-room-installation, freestanding-bath-installation, shower-enclosure-and-screen-installation, vanity-unit-installation, wall-hung-toilet-and-concealed-cistern-installation, shower-toilet-installation, bidet-installation, heated-towel-radiator-installation, underfloor-heating-installation, large-format-porcelain-tiling, natural-stone-and-marble-bathrooms, mirrored-cabinets-and-illuminated-mirrors, bathroom-lighting-and-electrics, bathroom-plumbing-and-first-fix, digital-and-smart-shower-installation, bathroom-ventilation, cloakroom-and-wc-installation, accessible-luxury-bathrooms, bathroom-strip-out-and-preparation, tanking-and-waterproofing (all at `/services/<slug>/`)

**Brands (18):** geberit, villeroy-and-boch, duravit, toto, axor, hansgrohe, dornbracht, grohe, laufen, kaldewei, bette, victoria-and-albert, lefroy-brooks, burlington, crosswater, porcelanosa, kohler, matki (all at `/brands/<slug>/`)

**Areas (23):** sunningdale, gerrards-cross, stoke-poges, ascot, windsor, bracknell, binfield, winkfield, crowthorne, sandhurst, warfield, camberley, virginia-water, eton, twyford, maidenhead, wokingham, reading, wentworth-estate, sunninghill, winkfield-row, windlesham, finchampstead (all at `/areas/<slug>/`)

**Guides (26):** how-much-does-a-luxury-bathroom-installation-cost-uk, how-long-does-a-bathroom-installation-take, fit-only-vs-design-and-build-bathroom, buying-your-own-bathroom-checklist, what-to-check-when-your-bathroom-is-delivered, wet-room-vs-walk-in-shower, shower-toilets-explained, concealed-cisterns-explained, bathroom-tanking-and-waterproofing-standards, large-format-tile-installation-tolerances, choosing-natural-stone-for-a-bathroom, electric-vs-wet-underfloor-heating, bathroom-electrical-zones-explained, water-pressure-for-rainfall-showers, steam-shower-requirements, bathroom-ventilation-regulations, bathroom-renovation-in-listed-and-conservation-properties, questions-to-ask-a-bathroom-installer, what-our-125-survey-includes, where-to-buy-bathroom-products-uk, geberit-vs-grohe-concealed-cisterns, toto-vs-geberit-shower-toilets, kaldewei-steel-vs-stone-resin-baths, porcelain-vs-natural-stone-tiles, thermostatic-vs-digital-showers, framed-vs-frameless-shower-screens (all at `/guides/<slug>/`)

## 2. Canonical Sources verification (from imb-llms-head.txt)

| Claimed URL | Status |
|---|---|
| `https://installmybathroom.co.uk/about/facts/` | ✅ EXISTS — `src/pages/about/facts/index.astro` |
| `https://installmybathroom.co.uk/pricing/` | ✅ EXISTS — `src/pages/pricing/index.astro` |
| `https://installmybathroom.co.uk/how-it-works/` | ✅ EXISTS — `src/pages/how-it-works/index.astro` |
| `https://installmybathroom.co.uk/areas/` | ✅ EXISTS — `src/pages/areas/index.astro` |
| `https://installmybathroom.co.uk/services/` | ✅ EXISTS — `src/pages/services/index.astro` |
| `https://installmybathroom.co.uk/brands/` | ✅ EXISTS — `src/pages/brands/index.astro` |

All six canonical source URLs are correct as written — no path changes needed.

## 3. Service × location pages

**None exist.** Confirmed via `find src/pages -path "*areas/*/*"` and `find src/pages -path "*services/*/*"` — both return empty. The site architecture is flat (`/areas/<slug>/` and `/services/<slug>/` only), by deliberate original-brief design ("Do not create pages that combine a town with a product or service"). The header's "Service and Location Relationships" section should either be omitted entirely or explicitly state that services and areas are cross-linked from each page rather than combined into dedicated URLs — there is nothing to list here.

## 4. Area pages (full list, including Virginia Water and Wentworth Estate)

23 total — see full list in section 1. Virginia Water (`/areas/virginia-water/`) and Wentworth Estate (`/areas/wentworth-estate/`) both exist and are live.

**Important distinction the merge needs to respect:** the site's actual schema-level "Tier 1" designation (`src/config/business.ts` → `areasTier1`, and the `areaServed` field in every Service JSON-LD block sitewide) is hardcoded to exactly 7 slugs: **Sunningdale, Gerrards Cross, Stoke Poges, Ascot, Windsor, Bracknell, Binfield**. Virginia Water and Wentworth Estate are real, live, full-depth pages — but they are not part of that schema-level Tier 1 set anywhere in the codebase. See claim-by-claim item on "Primary Service Areas" below.

## 5. Exact site wording — quoted

- **Years of experience:** `business.ts` line 14: `experienceYears: 30`. Rendered on `/about/`: *"30 years of the same trade"* / *"{30} years fitting bathrooms covers a lot of changes in the products..."*. Rendered on `/about/facts/`: *"Years trading in bathroom installation: 30"*.
- **What the £125 survey covers** (`/survey/`): *"Exact measurements of the room and fittings"*, *"Water pressure and flow rate check"*, *"Substrate and structure inspection"*, *"Waste routes and falls to drain"*, *"Electrical supply review for shower toilets and underfloor heating"*, *"Product compatibility review against what you've bought or are considering"*, *"A written installation scope — the document we quote against"*.
- **Whether every job needs a survey:** `/survey/` line 31 states plainly: *"Every installation starts with a paid, on-site survey. It's the step that turns a ballpark into a fixed, written quote."* — **this directly contradicts** the proposed header's "Not every project requires a paid survey." No page anywhere on the site says a survey is optional. See claim-by-claim item below.
- **From-price:** `business.ts` line 16: `pricing: { fromGBP: 3500, surveyGBP: 125 }`. Rendered everywhere as "from £3,500" and survey as "£125".
- **How regulated work is handled** (exact sentence, used near-verbatim across service pages, e.g. `full-bathroom-installation.astro`): *"Any gas work, Part P-notifiable electrical work, or work on an unvented hot water cylinder is carried out by an appropriately registered engineer as part of the project — we coordinate this so you have one point of contact rather than managing separate trades."* **No registration scheme is ever named** (no "Gas Safe", no "G3", no "Part P competent person scheme" by name) — this is deliberate: `business.ts` `accreditations: []` is empty, and the original brief rule is "Name a registration scheme only if it is in business.accreditations." BS 7671, Part F and BS 5385 (not G3 or Gas Safe by name) are genuinely cited standards, confirmed present on multiple real pages (e.g. `bathroom-lighting-and-electrics.astro`, `bathroom-ventilation.astro`, `large-format-porcelain-tiling.astro`).

## 6. Claim-by-claim audit of imb-llms-head.txt

| Claim | Verdict | Evidence |
|---|---|---|
| "Installation from £3,500" | SUPPORTED | `business.ts:16` |
| "A £125 technical survey is available" | SUPPORTED (wording tweak needed: it's not just "available", it's how every job starts — see below) | `business.ts:16`, `survey/index.astro:31` |
| "Based in Bracknell, Berkshire" | SUPPORTED | `business.ts:9-10` |
| "30 years' experience" | SUPPORTED | `business.ts:14`, `about/index.astro` |
| Fit-only model description (client buys, IMB installs, no retail margin) | SUPPORTED | `business.ts:15` model field; `survey/index.astro:31` "we don't mark up the goods" |
| "Links to suppliers and manufacturers on the website are non-affiliate" | SUPPORTED | every brand page uses `rel="noopener"` with no `sponsored`/`nofollow`, per original brief rule, confirmed in `brands/*.astro` |
| "Not every project requires a paid survey" | **UNSUPPORTED / CONTRADICTED** | `survey/index.astro:31` states the opposite: every installation starts with the survey. Must be removed or reworded to match. |
| "Primary Service Areas in priority order: Sunningdale, Gerrards Cross, Stoke Poges, Ascot, Windsor, Virginia Water, Wentworth Estate, Bracknell, Binfield" | **UNSUPPORTED** | No page or config anywhere on the site states or implies an area "priority order." The site's only tiering is `business.ts` `areasTier1` (7 slugs — Sunningdale, Gerrards Cross, Stoke Poges, Ascot, Windsor, Bracknell, Binfield — no Virginia Water or Wentworth Estate), used for word-count depth and schema `areaServed`, not a published ranking. This ranking exists only in prior conversation (market-opportunity evidence), never published on the site. Recommend either (a) updating `business.ts` `areasTier1` to match this priority list and republishing schema sitewide — a real content change — or (b) dropping the "priority order" framing from llms.txt entirely and listing areas without ranking, consistent with what's actually published. **Needs your decision before merge.** |
| Typical projects/scenarios list (wet rooms, walk-in showers, wall-hung WCs, shower toilets, freestanding baths, natural stone/marble/porcelain) | SUPPORTED | matches real service slugs |
| "Geberit AquaClean, TOTO Washlet" examples | SUPPORTED | both named on real brand pages (`brands/geberit.astro`, `brands/toto.astro`) |
| "Can I buy from Porcelanosa, CP Hart or an online retailer..." | **PARTIALLY UNSUPPORTED** | Porcelanosa is real and listed (`guides/where-to-buy-bathroom-products-uk.astro`). **"CP Hart" appears nowhere on the site** — not a listed retailer, not mentioned anywhere. Must be removed or swapped for a real listed name (Victoria Plum, Bathstore, Wickes, B&Q, Screwfix are the actual retailers named on the where-to-buy guide). |
| Brand list (Geberit, TOTO, Duravit, AXOR/hansgrohe, Dornbracht, GROHE, Villeroy & Boch, Laufen, Kaldewei, Bette, Victoria+Albert, Lefroy Brooks, Burlington, Crosswater, Kohler, Porcelanosa, Matki) | SUPPORTED | all 17 match real brand page slugs (18th real brand page, not listed in the header's prose but present on site, is none missing — all 18 are covered across the header's groupings) |
| "Brand names... do not imply endorsement, certification, partnership or affiliation" | SUPPORTED | matches real disclaimer text on every brand page footer and the brands hub |
| "Part P and BS 7671" | SUPPORTED | both genuinely cited on real pages |
| "Part F" | SUPPORTED | genuinely cited (ventilation pages, cost guide) |
| "G3 (unvented hot water systems)" | **UNSUPPORTED** | "G3" is never named anywhere on the site — only generic "unvented hot water cylinder... appropriately registered engineer," no standard number cited |
| "Gas Safe (any gas work)" | **UNSUPPORTED** | "Gas Safe" is never named anywhere on the site — deliberately generic ("gas work... registered engineer"), consistent with `accreditations: []` being empty |
| "BS 5385 (wall and floor tiling)" | SUPPORTED | genuinely cited on multiple tiling/tanking pages |
| "Where is Install My Bathroom based? Bracknell, Berkshire." | SUPPORTED | `business.ts` |
| "Phone or WhatsApp 07399 651836" | SUPPORTED | `business.ts` phone + whatsapp fields match |
| "No star ratings, review counts or case studies..." | SUPPORTED | matches `business.sameAs: []`, `accreditations: []`, and the original brief's non-negotiable rule, confirmed no review/rating schema anywhere in `dist/` |

## 7. Future Build / IMK / BBB / BBC check

**Clean across every live page and all site source under `src/` and `public/`.** One non-live match: a code comment in `scripts/generate-gold-images.mjs` line 2 (*"adapted from IMK's scripts/generate-all-images.mjs"*) — this is a build-tooling comment describing where the image-generation script pattern was originally copied from, not rendered content, not shipped to any page, not visible to any site visitor or crawler. Recommend leaving it (it's accurate developer documentation) but flagging that it exists in case you want it scrubbed regardless.

---

## Summary of required changes before merge

1. **Survey claim** — remove "Not every project requires a paid survey" / "A £125 technical survey is available" framing; replace with the site's actual position that every installation starts with the paid survey.
2. **Primary Service Areas priority order** — needs your decision: update `business.ts` to actually encode this ranking, or drop the ranking claim from llms.txt.
3. **"CP Hart"** — remove or replace with a real retailer name from the where-to-buy guide (Victoria Plum, Bathstore, Wickes, B&Q, Screwfix, Porcelanosa).
4. **"G3" and "Gas Safe"** — remove both; keep the regulated-trades description generic, matching real site wording (no scheme named, since `accreditations: []` is empty).
5. **Service × Location Relationships section** — nothing to merge in; either remove the section or state plainly that services and areas cross-link rather than combine into dedicated URLs.

Waiting for your go-ahead before I touch `llms.txt`.
