# BUILD-LOG.md — installmybathroom.co.uk

## Status: gold pages built, paused for review (per user instruction — see "Autonomy" below)

### Autonomy note
The brief (§"Non-negotiables") asks for a fully autonomous build through to Netlify
deploy and DNS cutover. Per explicit user instruction this session, the build stops
after the gold-page milestone (brief §9 step 2) for review. No Netlify site, DNS, or
`netlify deploy` has been run. The user separately asked to push this repo to GitHub
so they can connect it in the Netlify UI themselves (Git-based deploy, not CLI deploy)
— that push is the only "shipping" action taken.

## 1. Source repo located

IMK repo: `/home/pindi/installmykitchen` (confirmed canonical — has the live GitHub
remote `pindi109/installmykitchen` and the most recent commit; two other local copies,
`/home/pindi/imk_site/installmykitchen` and `/home/pindi/installmykitchen-audit/installmykitchen`,
are not git repos and were not used).

Amy chat widget reference: `/home/pindi/berkshire-bespoke-builders` (netlify/functions/chat.js,
out/js/chat-widget.js, out/css/chat-widget.css) — this is the actual "Amy" implementation;
the sibling BBC repo has an equivalent but unnamed assistant, not used as the primary reference.

## 2. Stack

Astro 6.4.8 (static) + Tailwind v4 (CSS-first, no tailwind.config.js — tokens live in
`src/styles/global.css`) + Netlify, matching IMK exactly. **Important:** `@tailwindcss/vite`
and `tailwindcss` are pinned to the exact version `4.3.1` (not `^4.3.1`) in package.json,
and `package-lock.json` is copied from IMK's lockfile (with only the root package name
changed) rather than freshly resolved. A fresh `npm install` with caret ranges pulls
`@tailwindcss/vite`'s own nested `vite@8.3.2` + `rolldown`, which has a build-breaking bug
(`Missing field tsconfigPaths on BindingViteResolvePluginConfig.resolveOptions`). Do not
run `npm update` on these two packages without retesting the build. Also added
`tsconfig.json` (missing from a bare scaffold; IMK has one and vite's Tailwind plugin
appears to depend on it being present).

## 3. What was copied vs. rebuilt

| From IMK | Treatment |
|---|---|
| `astro.config.mjs`, `tsconfig.json` | Copied, site URL changed |
| `src/styles/global.css` | Copied as-is — same colour scheme as IMK per brief §1 (added one `--brass` token for brand-page copy). Logo teal (`IMB logo.png`, ~#0F6B63) doesn't clash with IMK's `--teal: #0F766E`, so no palette change was needed. |
| `src/layouts/Base.astro` | Rebuilt: kept the gold cursor FX canvas script and the fade-up IntersectionObserver script verbatim (brief: "identical behaviour"). Dropped `CookieConsent`, `CostCalculator`, `StickyEstimateBar` — IMB has no tracking cookies yet and no cost calculator was asked for. Removed Ahrefs/GA4 scripts and the Google site-verification tag entirely; left a `<!-- ANALYTICS SLOT -->` comment per brief §1. Added `<link>`/`<script>` tags for the Amy chat widget. |
| `Header.astro`, `Footer.astro`, `StickyMobileCTA.astro`, `WhatsAppButton.astro` | Rebuilt with IMB nav/copy, reading phone/WhatsApp/email from `src/config/business.ts` instead of hardcoded strings (IMK has no such config — NAP is duplicated literally across ~16 files there; IMB does not repeat that mistake). |
| `FAQ.astro`, `Breadcrumbs.astro` | Copied near-verbatim (generic, no brand strings) — only the canonical site URL in `Breadcrumbs.astro` changed. |
| `BusinessSchema.astro` | Rebuilt as `HomeAndConstructionBusiness` (brief §6.1) instead of `LocalBusiness`, no `streetAddress`, `areaServed` as a `Place[]` array, reads from `business.ts`. |
| Image pipeline (`generate-all-images.mjs`, Sharp crop) | **Not yet ported.** No images generated this session — see §6 below. |
| `qa.mjs` | **Does not exist in IMK** (confirmed — no QA script anywhere in that repo, despite the brief assuming one exists to "extend"). Not built yet; this is brief step 6, after mass content generation, not part of the gold-page milestone. |

## 4. `src/config/business.ts`

Created fresh, matching the brief's §2 shape exactly. `sameAs: []` and `accreditations: []`
are empty until real ones exist — footer social icons and schema `sameAs` are conditionally
rendered so nothing fake shows up.

## 5. Tier 2 area list (brief §4.4)

Pulled area slugs from both `/home/pindi/berkshire-bespoke-builders/out/areas/` and
`/home/pindi/project-pindi/sites/berkshire-bespoke-carpentry/app/areas/`. Combined, deduped,
removed the 7 Tier-1 towns and the generic "berkshire" catch-all, leaving 14 candidates:
Winkfield, Thatcham, Newbury, Reading, Crowthorne, Sandhurst, Virginia Water, Slough,
Twyford, Maidenhead, Wokingham, Camberley, Eton, Warfield.

Needed 11. Dropped Thatcham, Newbury and Slough — the two Thatcham/Newbury are the furthest
west from Bracknell (~20+ miles, outside the natural service radius the other towns share)
and Slough skews away from the premium-home profile the brief's positioning targets. This is
a judgement call, not a verified fact — flagging it so it can be overridden.

**Final Tier 2 (11):** Winkfield, Crowthorne, Sandhurst, Warfield, Camberley, Virginia Water,
Eton, Twyford, Maidenhead, Wokingham, Reading. Stored in `src/data/areas.json`.

## 6. Images

Not generated. `FAL_KEY` is not set in this environment (checked shell env, `~/.bashrc`,
and this repo's `.env` — none exist; BBC's `.env.local` has a real `FAL_KEY` value that can
be copied across when ready). `ANTHROPIC_API_KEY` **is** already exported in `~/.bashrc` and
works for the Amy function as-is. Gold pages render with no hero image (`hero-manifest.json`
is `{}`) — `Base.astro` degrades gracefully when a slug has no manifest entry, so this isn't
a build error, just an empty hero block.

`scripts/generate-all-images.mjs` has not been ported from IMK yet — that's brief step 4,
after mass content generation, not part of this milestone.

## 7. Amy chat widget (brief §8)

Adapted from BBB's `chat.js`/`chat-widget.js`/`chat-widget.css`, with two additions the BBB
reference doesn't have (both required by the brief, neither existed in BBB's current site):

- **Per-IP rate limiting**: in-memory sliding window (12 req/min), best-effort only —
  Netlify Functions don't guarantee a warm container between invocations, so this throttles
  bursts within one warm instance, not a durable cross-instance limit. Flagging this as a
  known limitation rather than overstating it.
- **Lead capture**: added a "Leave details" mini-form in the widget (name/email/phone) that
  POSTs to the chat function, which forwards it to Netlify Forms (`form-name=enquiry`,
  `source=amy`). Added `public/netlify-forms.html` as the static form-twin so Netlify's
  build-time bot registers the `enquiry` and `survey` form schemas — this is the same
  "form-twin" gotcha noted from BBC's build (dynamic form submissions need a static twin
  for Netlify to detect the schema at build time).

System prompt rewritten for IMB facts/rules per brief §8 exactly (no competitor mentions,
no invented prices/dates, no claimed reviews/accreditations).

## 8. Gold pages built (brief §9 step 2)

- `/` (homepage) — ~1,980 words
- `/services/full-bathroom-installation/` — ~1,190 words
- `/brands/geberit/` — ~1,110 words
- `/areas/sunningdale/` — ~1,240 words
- `/guides/how-much-does-a-luxury-bathroom-installation-cost-uk/` — ~985 words

Plus 4 hub pages (`/services/`, `/brands/`, `/areas/`, `/guides/`) so header/footer nav
doesn't dead-end on the pages that do exist.

**Word counts are below the brief's §5 minimums** (service 1,800 / brand 1,400 / area Tier-1
2,000 / guide 1,800). These are first-pass drafts written to validate structure, voice, FAQ
schema wiring, and banned-word compliance — not final content. Expanding to the required
depth is scoped into step 3 (mass content generation), not this milestone, so I didn't pad
them artificially to hit a number.

**Areas NOT yet built** that the gold pages and nav link to (will 404 in local dev):
`/ascot/`, `/virginia-water/`, `/windsor/`, `/bracknell/`, `/contact/`, `/survey/`,
`/pricing/`, `/about/`, `/faqs/`, `/how-it-works/`, `/privacy/`, `/terms/`, `/cookies/`,
all other 23 services, all other 17 brands, all other guides. This is expected at this
milestone and is step 3 of the brief's build order.

## 9. QA self-check run against the gold pages (manual, not `qa.mjs` — doesn't exist yet)

- ✅ No banned brand strings in `dist/` (one incidental, intentional "kitchen" — "a wider
  renovation that includes a kitchen or extension" on the homepage — a genuine sentence,
  not a brand reference, matching the brief's own carve-out for this case)
- ✅ No `streetAddress` anywhere in schema
- ✅ No `www.installmybathroom.co.uk` anywhere
- ✅ Entity one-liner present verbatim on homepage, first 100 words
- ✅ `npm run build` completes clean, 9/9 pages, all gold pages return 200 in dev
- ⚠️ Word counts under §5 minimums (see §8 above)
- ⚠️ No images yet (see §6)
- ⚠️ `qa.mjs`, `llms.txt`, `llms-full.txt`, sitemap, full robots.txt brand coverage — not
  built yet (brief steps 4–6)

## 10. Known upstream issue, flagged not fixed

`npm audit` reports vulnerabilities in the pinned Astro 6.4.x / esbuild / sharp versions
(inherited directly from matching IMK's stack, per brief §1). `npm audit fix --force` would
bump to Astro 7.3.5, a breaking change to templates copied from IMK — not applied without a
decision, since it affects IMK too and should probably be fixed there first if at all.

## 11. Next steps (not started)

1. Review gold pages locally (`npm run dev` on this repo).
2. Decide on Tier 2 area list override, if any (§5).
3. Mass content generation for remaining ~93 pages (brief step 3).
4. Set `FAL_KEY` and run image generation (brief step 4).
5. Build `llms.txt`, `llms-full.txt`, `/about/facts/`, sitemap config (brief step 5).
6. Write `qa.mjs` from scratch (brief §10) and iterate to a clean pass (brief step 6).
7. Netlify site creation + first deploy + DNS (brief §11) — all manual, by the user.
