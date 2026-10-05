/**
 * IMB Gold-Page Image Generation — 3×3 Grid Strategy (adapted from IMK's
 * scripts/generate-all-images.mjs). Each API call generates ONE 4K image
 * containing a 3×3 grid of 9 distinct scenes; all 9 cells are cropped,
 * resized to the brief's three target ratios (§7), and saved as WebP.
 *
 * Covers only the 5 gold pages built so far — not the full ~100-page set.
 * Run with: FAL_KEY=xxx node scripts/generate-gold-images.mjs
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const HERO_MANIFEST = join(ROOT, "public/hero-manifest.json");
const ALT_TAGS = join(ROOT, "src/data/alt-tags.json");
const IMAGE_MANIFEST = join(ROOT, "src/data/image-manifest.json");

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error("[FATAL] FAL_KEY not set"); process.exit(1); }
const FAL_MODEL = process.env.FAL_MODEL || "fal-ai/nano-banana-pro";
const FAL_URL = `https://fal.run/${FAL_MODEL}`;

const GRID_COLS = 3;
const GRID_ROWS = 3;
const CELL_FLOOR = 500;
const GRID_FLOOR = 1800;

// Brief §7: photoreal luxury bathroom interiors appropriate to large Berkshire/
// Buckinghamshire homes. Natural daylight, honed and polished stone, large-format
// porcelain, brushed brass and nickel, wall-hung sanitaryware, frameless glass,
// no people, no visible text or logos.
const STYLE = "photoreal luxury bathroom interiors appropriate to large Berkshire and Buckinghamshire homes, natural daylight, honed and polished stone, large-format porcelain, brushed brass and nickel, wall-hung sanitaryware, frameless glass, editorial interior photography, sharp focus, ultra-detailed, not stock-photo cheesy, not AI-generated looking, no people, no visible text, no logos, no watermarks, no borders between cells";

// Brief §7 target sizes
const SIZES = {
  hero: { w: 1834, h: 1024 },   // 16:9
  mid: { w: 800, h: 600 },      // 4:3
  portrait: { w: 540, h: 960 }, // 9:16
};

const GRIDS = [
  {
    prompt: `A 3x3 grid of nine distinct photorealistic luxury bathroom images, evenly divided into nine equal cells (3 columns, 3 rows), no borders, no gaps between cells.
TOP-LEFT: Wide hero shot of a finished luxury bathroom — honed stone walls, large-format porcelain floor, wall-hung sanitaryware, freestanding bath, brushed brass taps, natural daylight from a large window.
TOP-CENTER: Wide hero shot of a large period-house en-suite — stone and porcelain, walk-in shower with frameless glass screen, warm natural light, generous proportions suggesting a large detached home.
TOP-RIGHT: Wide hero shot of a bathroom mid-installation — tiler setting large-format porcelain tiles from a centre line, tools and tile spacers visible, natural daylight, no people's faces visible.
MIDDLE-LEFT: Close-up of a wall-hung toilet with concealed cistern and brushed brass flush plate, tiled wall behind, precise grout lines.
MIDDLE-CENTER: Flatlay of a consultation desk — tile samples, a tape measure, a notepad with a floor plan sketch, brass tap sample, soft natural light from above.
MIDDLE-RIGHT: Macro close-up of a brushed brass wall-mounted tap over a stone basin, water droplet detail, soft natural light.
BOTTOM-LEFT: Walk-in shower with large-format porcelain tiling and frameless glass screen, brushed nickel shower head, stone niche shelf.
BOTTOM-RIGHT: Vertical-friendly shot of a freestanding stone-resin bath beside a large window with soft natural daylight, minimal styling.
BOTTOM-CENTER: Vertical-friendly close-up of a large-format porcelain tiled corner with a precise mitred edge, natural light raking across the surface.
STYLE: ${STYLE}.`,
    cells: [
      { file: "heroes/index-hero.webp", sizeKey: "hero", alt: "Finished luxury bathroom with honed stone, large-format porcelain and brushed brass fittings", heroSlug: "" },
      { file: "heroes/areas/sunningdale-hero.webp", sizeKey: "hero", alt: "Large period-house en-suite with stone and porcelain finishes and a walk-in shower", heroSlug: "areas/sunningdale" },
      { file: "heroes/services/full-bathroom-installation-hero.webp", sizeKey: "hero", alt: "Tiler setting large-format porcelain tiles from a centre line during a bathroom installation", heroSlug: "services/full-bathroom-installation" },
      { file: "inline/wall-hung-toilet-detail.webp", sizeKey: "mid", alt: "Wall-hung toilet with concealed cistern and brushed brass flush plate" },
      { file: "inline/survey-flatlay.webp", sizeKey: "mid", alt: "Consultation flatlay with tile samples, tape measure and a floor plan sketch" },
      { file: "inline/brass-tap-macro.webp", sizeKey: "mid", alt: "Macro detail of a brushed brass wall-mounted tap over a stone basin" },
      { file: "inline/walk-in-shower-wide.webp", sizeKey: "mid", alt: "Walk-in shower with large-format porcelain tiling and a frameless glass screen" },
      { file: "inline/freestanding-bath-portrait.webp", sizeKey: "portrait", alt: "Freestanding stone-resin bath beside a window with natural daylight" },
      { file: "inline/porcelain-corner-detail.webp", sizeKey: "portrait", alt: "Large-format porcelain tiled corner with a precise mitred edge" },
    ],
  },
  {
    prompt: `A 3x3 grid of nine distinct photorealistic luxury bathroom images, evenly divided into nine equal cells (3 columns, 3 rows), no borders, no gaps between cells.
TOP-LEFT: Wide hero shot of a Geberit-style wall-hung WC installation mid-fit — carrier frame visible before boarding, brushed steel fixings, natural daylight in a large bathroom.
TOP-CENTER: Wide hero shot of a flatlay desk scene for a cost and planning guide — calculator, floor plan, swatches of stone and porcelain, brass tap sample, soft overhead light.
TOP-RIGHT: Wide shot of a large detached period-style home exterior in a leafy Berkshire setting, mature trees, gravel driveway, no specific identifying features, natural daylight.
MIDDLE-LEFT: Close-up of a concealed cistern carrier frame being fixed to a structural wall, spirit level in shot, before tiling.
MIDDLE-CENTER: Close-up of a modern shower toilet unit with a brushed finish and a slim remote control beside it, tiled wall behind.
MIDDLE-RIGHT: Close-up of underfloor heating pipes being laid in a screed bed before stone tiling, neat even spacing.
BOTTOM-LEFT: Finished large stone-tiled wet room with a linear drain and frameless glass partition, natural light.
BOTTOM-RIGHT: Vertical-friendly shot of a tall stone-clad shower niche with neatly stacked folded towels, soft natural light.
BOTTOM-CENTER: Vertical-friendly close-up of a large period-house window with stone bathroom tiling visible at the edge of frame, warm natural daylight.
STYLE: ${STYLE}.`,
    cells: [
      { file: "heroes/brands/geberit-hero.webp", sizeKey: "hero", alt: "Wall-hung WC installation mid-fit with carrier frame visible before boarding", heroSlug: "brands/geberit" },
      { file: "heroes/guides/cost-hero.webp", sizeKey: "hero", alt: "Flatlay planning scene for a bathroom installation cost guide with swatches and a floor plan", heroSlug: "guides/how-much-does-a-luxury-bathroom-installation-cost-uk" },
      { file: "inline/sunningdale-exterior.webp", sizeKey: "mid", alt: "Large detached period-style home exterior in a leafy Berkshire setting" },
      { file: "inline/carrier-frame-fixing.webp", sizeKey: "mid", alt: "Concealed cistern carrier frame being fixed to a structural wall before tiling" },
      { file: "inline/shower-toilet-detail.webp", sizeKey: "mid", alt: "Modern shower toilet unit with a brushed finish and slim remote control" },
      { file: "inline/underfloor-heating-pipes.webp", sizeKey: "mid", alt: "Underfloor heating pipes laid in a screed bed before stone tiling" },
      { file: "inline/wet-room-finished.webp", sizeKey: "mid", alt: "Finished large stone-tiled wet room with a linear drain and frameless glass partition" },
      { file: "inline/shower-niche-portrait.webp", sizeKey: "portrait", alt: "Tall stone-clad shower niche with neatly folded towels" },
      { file: "inline/period-window-portrait.webp", sizeKey: "portrait", alt: "Large period-house window with stone bathroom tiling visible at the edge of frame" },
    ],
  },
];

async function callFal(prompt) {
  const res = await fetch(FAL_URL, {
    method: "POST",
    headers: { "Authorization": `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, aspect_ratio: "4:3", resolution: "4K", num_images: 1, output_format: "png" }),
  });
  if (!res.ok) { const t = await res.text(); throw new Error(`fal ${res.status}: ${t}`); }
  const data = await res.json();
  const img = data?.images?.[0];
  if (!img?.url) throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 200)}`);
  const dlRes = await fetch(img.url);
  if (!dlRes.ok) throw new Error(`download failed: ${dlRes.status}`);
  const buf = Buffer.from(await dlRes.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const short = Math.min(meta.width, meta.height);
  console.log(`  grid: ${meta.width}×${meta.height}px short=${short}px`);
  if (short < GRID_FLOOR) throw new Error(`grid too small: ${short}px`);
  return { buf, width: meta.width, height: meta.height };
}

async function cropCell(buf, gridW, gridH, row, col, sizeCfg) {
  const cW = Math.floor(gridW / GRID_COLS);
  const cH = Math.floor(gridH / GRID_ROWS);
  const x = col * cW;
  const y = row * cH;
  if (Math.min(cW, cH) < CELL_FLOOR) throw new Error(`cell too small: ${cW}×${cH}`);
  const cell = await sharp(buf).extract({ left: x, top: y, width: cW, height: cH }).toBuffer();
  return sharp(cell).resize(sizeCfg.w, sizeCfg.h, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toBuffer();
}

const heroManifest = existsSync(HERO_MANIFEST) ? JSON.parse(readFileSync(HERO_MANIFEST, "utf8")) : {};
const altTags = existsSync(ALT_TAGS) ? JSON.parse(readFileSync(ALT_TAGS, "utf8")) : {};
const imageManifest = existsSync(IMAGE_MANIFEST) ? JSON.parse(readFileSync(IMAGE_MANIFEST, "utf8")) : {};

function saveManifests() {
  writeFileSync(HERO_MANIFEST, JSON.stringify(heroManifest, null, 2) + "\n");
  writeFileSync(ALT_TAGS, JSON.stringify(altTags, null, 2) + "\n");
  writeFileSync(IMAGE_MANIFEST, JSON.stringify(imageManifest, null, 2) + "\n");
}

console.log(`\n${"=".repeat(60)}`);
console.log(` IMB Gold-Page Image Generation — ${GRIDS.length} grids, ~${GRIDS.length * 9} images`);
console.log(` Model: ${FAL_MODEL}`);
console.log(`${"=".repeat(60)}\n`);

let ok = 0, skip = 0, fail = 0;

for (let gi = 0; gi < GRIDS.length; gi++) {
  const grid = GRIDS[gi];
  console.log(`\n> Grid ${gi}`);

  const allExist = grid.cells.every((c) => existsSync(join(ROOT, "public/assets", c.file)));
  if (allExist) {
    console.log(`  [skip] all 9 cells already exist`);
    skip += 9;
    continue;
  }

  let gridImg;
  try {
    gridImg = await callFal(grid.prompt);
  } catch (err) {
    console.error(`  [ERR] API call failed: ${err.message}`);
    fail += 9;
    continue;
  }

  for (let i = 0; i < grid.cells.length; i++) {
    const cell = grid.cells[i];
    const row = Math.floor(i / GRID_COLS);
    const col = i % GRID_COLS;
    const outPath = join(ROOT, "public/assets", cell.file);
    const pubPath = `/assets/${cell.file}`;

    if (existsSync(outPath)) {
      console.log(`  [skip] ${cell.file}`);
      skip++;
    } else {
      try {
        mkdirSync(outPath.split("/").slice(0, -1).join("/"), { recursive: true });
        const cellBuf = await cropCell(gridImg.buf, gridImg.width, gridImg.height, row, col, SIZES[cell.sizeKey]);
        writeFileSync(outPath, cellBuf);
        console.log(`  -> ${cell.file} (${SIZES[cell.sizeKey].w}x${SIZES[cell.sizeKey].h})`);
        ok++;
      } catch (err) {
        console.error(`  [ERR] cell ${i} (${cell.file}): ${err.message}`);
        fail++;
        continue;
      }
    }

    imageManifest[cell.file] = { path: pubPath, alt: cell.alt };
    if (cell.heroSlug !== undefined) {
      heroManifest[cell.heroSlug] = pubPath;
      altTags[cell.heroSlug] = cell.alt;
    }
    saveManifests();
  }
}

saveManifests();
console.log(`\n${"=".repeat(60)}`);
console.log(` Done: ${ok} generated, ${skip} skipped, ${fail} failed`);
console.log(`${"=".repeat(60)}\n`);
