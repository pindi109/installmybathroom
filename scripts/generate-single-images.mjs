/**
 * IMB Single-Image Generation — generalized runner.
 *
 * Generates ONE image per API call per job, with a strict 6-part prompt per
 * job, so the model gives full attention to a single scene instead of
 * splitting attention across a 3x3 grid (see generate-gold-images.mjs for
 * the older grid approach, superseded by this for anything needing
 * construction-sequence or compositional precision).
 *
 * Usage:
 *   node scripts/generate-single-images.mjs <jobs-file.json>
 *
 * <jobs-file.json> is an array of:
 *   { outputPath, prompt, aspectRatio, targetWidth, targetHeight }
 * outputPath is relative to public/assets/. Output is always .webp.
 *
 * Safe to run many instances in parallel against DIFFERENT job files — each
 * invocation only touches the output paths listed in its own job file, so
 * there's no shared-state race as long as job files don't overlap on
 * outputPath. (reads FAL_KEY from .env.local)
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- load FAL_KEY from .env.local without a dotenv dependency ---
function loadEnvLocal() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}
loadEnvLocal();

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) { console.error("[FATAL] FAL_KEY not set"); process.exit(1); }
const FAL_MODEL = process.env.FAL_MODEL || "fal-ai/nano-banana-pro";
const FAL_URL = `https://fal.run/${FAL_MODEL}`;

const STYLE_SUFFIX =
  " Photoreal editorial interior/architectural photography, sharp focus, ultra-detailed, not stock-photo cheesy, not AI-generated looking.";

const TEAL_WORKWEAR =
  " The installer wears a plain heavyweight teal cotton garment (hoodie or t-shirt) with no text, logo, or print of any kind; face is angled down and away toward the work, not toward the camera.";

const jobsFileArg = process.argv[2];
if (!jobsFileArg) {
  console.error("[FATAL] Usage: node scripts/generate-single-images.mjs <jobs-file.json>");
  process.exit(1);
}
const jobsFilePath = resolve(process.cwd(), jobsFileArg);
if (!existsSync(jobsFilePath)) {
  console.error(`[FATAL] Jobs file not found: ${jobsFilePath}`);
  process.exit(1);
}
/** @type {{outputPath:string, prompt:string, aspectRatio:string, targetWidth:number, targetHeight:number}[]} */
const JOBS = JSON.parse(readFileSync(jobsFilePath, "utf8"));
if (!Array.isArray(JOBS) || JOBS.length === 0) {
  console.error("[FATAL] Jobs file must be a non-empty JSON array");
  process.exit(1);
}

const _UNUSED_EXAMPLE_JOBS = [
  {
    outputPath: "proof/services/wet-room-installation-hero.webp",
    aspectRatio: "16:9",
    targetWidth: 1834,
    targetHeight: 1024,
    prompt:
      "Purpose: communicate the premium, fully finished result of a wet room installation to reassure a prospective client browsing the wet-room-installation service page that this company delivers bespoke, luxury-grade wet rooms in large homes." +
      " Subject and action: a fully finished luxury wet room, no people present, showing a level walk-in wet area with a linear floor drain and a frameless glass partition separating the wet zone from the rest of the room." +
      " Setting and work stage: entirely complete installation — honed large-format porcelain tiling fully grouted on both floor and walls, a wall-hung vanity unit with a stone countertop basin, a brushed brass thermostatic shower valve and overhead rainfall head already fixed in place; no tools, no dust, no protective coverings, no construction materials visible anywhere in frame." +
      " Composition: standing eye level at approximately 1.6m, 24mm wide architectural lens, wide shot framing the full wet room from the doorway, with the walk-in shower area as the focal point centred in the frame." +
      " Light and materials: neutral daylight with gentle warmth in the highlights entering from an unseen window to the left, softly diffused; textures show honed stone grain and the matte sheen of large-format porcelain alongside the brushed, slightly satin texture of the brass fittings." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/services/ensuite-installation-hero.webp",
    aspectRatio: "16:9",
    targetWidth: 1834,
    targetHeight: 1024,
    prompt:
      "Purpose: show a prospective client browsing the en-suite installation service page a different finished luxury en-suite style, softer and more residential than a wet room, to demonstrate design range." +
      " Subject and action: a fully finished luxury en-suite bathroom, no people, featuring a freestanding stone-resin bath positioned beneath a window and a separate framed glass shower enclosure to one side." +
      " Setting and work stage: entirely complete — book-matched natural stone wall behind the bath, polished chrome bath filler already fixed, folded white towels neatly draped over a wall-mounted brushed nickel towel rail; no tools, dust sheets, or construction materials visible." +
      " Composition: standing eye level at approximately 1.6m, 24mm wide architectural lens, wide shot framing the bath as the focal point with the shower enclosure visible in the background to the right." +
      " Light and materials: neutral daylight with gentle warmth in the highlights streaming through the window behind the bath, soft natural shadow falloff; observable textures include the veining of natural stone, the matte ceramic surface of the bath, and the brushed nickel of the towel rail." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/guides/sheet-membrane-bedding.webp",
    aspectRatio: "4:3",
    targetWidth: 800,
    targetHeight: 600,
    prompt:
      "Purpose: build technical trust on a tanking-and-waterproofing guide page by showing correct, methodical waterproofing practice before tiling begins — a hidden but critical stage of bathroom installation work." +
      " Subject and action: one installer, viewed from the side and slightly behind so his face is turned down toward the work, is using a flat trowel to press and smooth a sheet waterproofing membrane into a bed of grey adhesive that has just been combed onto a cement backer board on the floor; his hand and the trowel are in direct physical contact with the membrane surface." +
      " Setting and work stage: bare cement backer-boarded floor and walls with no tiles, grout, or any finished fixtures anywhere in frame — this is strictly the waterproofing-before-tiling stage, using ONLY a sheet membrane method (no liquid coating); a stack of porcelain tiles is visible only faintly in the far background through a doorway, clearly outside the current work zone, making clear tiling has not started in this room; a notched trowel and a roll of unused membrane sit on the floor nearby." +
      " Composition: kneeling-worker eye level at approximately 1.2m, 50mm normal lens, medium-close framing on the installer's hands and the membrane/adhesive contact point as the focal point, body visible from the side." +
      " Light and materials: neutral daylight with gentle warmth in the highlights from a window out of frame, slightly flat and even to show texture; observable adhesive ridge texture, the matte grey sheen of the membrane, and minor dust on the floor edges as a realistic imperfection." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      TEAL_WORKWEAR +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/guides/carrier-frame-fixing.webp",
    aspectRatio: "4:3",
    targetWidth: 800,
    targetHeight: 600,
    prompt:
      "Purpose: demonstrate on a concealed-cisterns guide page that the installer correctly fixes the structural carrier frame to the wall before any boarding or tiling conceals it, at a distinct and earlier construction stage than waterproofing or tiling." +
      " Subject and action: one installer, face turned down toward the work, is holding a spirit level against a metal concealed-cistern carrier frame with one hand while tightening a fixing bolt securing the frame's rear bracket to the bare masonry wall with the other." +
      " Setting and work stage: bare brick/blockwork wall with first-fix plumbing pipework stubbed out but no plasterboard, backer board, waterproofing membrane, or tiling present anywhere — this is the structural first-fix stage, strictly before boarding; no cistern cover plate, pan, or any finished sanitaryware is present, only the raw steel-frame structure; a power drill and a bag of wall fixings sit on the floor nearby." +
      " Composition: kneeling-worker eye level at approximately 1.2m, 50mm normal lens, medium-close framing centred on the spirit level and the bracket fixing point as the focal point." +
      " Light and materials: neutral daylight with gentle warmth in the highlights from an unseen side window, slightly directional to reveal the texture of the brick wall and the brushed-steel sheen of the carrier frame tubing; minor dust and a faint chalk line on the wall as realistic imperfection." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      TEAL_WORKWEAR +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/brands/axor-brass-tap-macro.webp",
    aspectRatio: "4:3",
    targetWidth: 800,
    targetHeight: 600,
    prompt:
      "Purpose: showcase the premium material quality of a brushed brass wall-mounted tap on the Axor brand page, giving prospective clients confidence in the fixture-level finish quality this installer works with." +
      " Subject and action: a macro close-up of a single brushed brass wall-mounted basin tap with water just beginning to flow from the spout, no people, no hands, set above a honed stone basin surface below." +
      " Setting and work stage: fully finished installation context — tap already fixed flush to a tiled wall, a single bead of sealant visible at the tile junction, a few scattered water droplets on the stone surface below, nothing else in frame." +
      " Composition: static macro framing at an implied close working distance, 85mm shallow depth-of-field macro lens, tap spout and water stream as the sharp focal point with the stone basin falling into soft background blur." +
      " Light and materials: neutral daylight with gentle warmth in the highlights from one side, raking slightly to pick out the brushed linear texture of the brass and the specular highlight on the water droplets; honed stone grain visible in the out-of-focus background." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/services/large-format-porcelain-corner-portrait.webp",
    aspectRatio: "9:16",
    targetWidth: 540,
    targetHeight: 960,
    prompt:
      "Purpose: demonstrate the precision of large-format porcelain tiling work on the large-format-porcelain-tiling service page, emphasising tight tolerances and a seamless mitred corner finish." +
      " Subject and action: a vertical close-up of a finished internal corner where two large-format porcelain tile panels meet in a precise mitred joint, no people, no hands." +
      " Setting and work stage: fully finished, grouted and clean — no construction materials, spacers, or tools visible, just the completed tiled surface." +
      " Composition: standing eye level at approximately 1.6m, 50mm normal lens, tight vertical framing on the mitred corner seam as the focal point, running from floor level upward." +
      " Light and materials: neutral daylight with gentle warmth in the highlights raking across the surface from one side at a shallow angle to emphasise the flatness and sheen of the porcelain and the hairline precision of the mitred joint." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/areas/gerrards-cross-exterior.webp",
    aspectRatio: "4:3",
    targetWidth: 800,
    targetHeight: 600,
    prompt:
      "Purpose: provide a locally-relevant, non-landmark-specific exterior image for the Gerrards Cross area page that signals the affluent, leafy residential character of the homes this business serves, without claiming any specific real address or landmark." +
      " Subject and action: a wide exterior view of a large detached period-style British family home, no people, no visible house numbers or identifying signage." +
      " Setting and work stage: not applicable (exterior architecture, not a construction stage) — mature trees and clipped hedging framing the property, a gravel driveway in the foreground, autumn-toned leafy planting." +
      " Composition: standing eye level at approximately 1.6m, 24mm wide architectural lens, wide establishing shot with the house frontage centred as the focal point." +
      " Light and materials: neutral daylight with gentle warmth in the highlights, soft overcast-leaning daylight typical of the English Home Counties; observable textures include weathered red brick, painted white window frames, and gravel grain in the foreground." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark, no real identifiable landmark or address." +
      STYLE_SUFFIX,
  },
  {
    outputPath: "proof/guides/consultation-flatlay.webp",
    aspectRatio: "4:3",
    targetWidth: 800,
    targetHeight: 600,
    prompt:
      "Purpose: illustrate the careful measuring and material-selection process described on the survey/consultation guide page, reassuring clients that every project begins with a detailed, professional survey." +
      " Subject and action: a flatlay desk scene showing a pair of hands, cropped at the wrist with no face shown, using a tape measure against a printed floor plan sketch, with material samples arranged nearby." +
      " Setting and work stage: pre-construction planning stage — a floor plan sketch with pencil annotations, a stone tile sample, a brushed brass tap sample, and a folded fabric swatch arranged on a plain wooden desk surface; no construction tools or site materials, this is an office/consultation setting." +
      " Composition: top-down flatlay angle, camera directly overhead at approximately 1m above the desk, 50mm normal lens, the tape measure and floor plan as the central focal point with samples arranged around the edges." +
      " Light and materials: neutral daylight with gentle warmth in the highlights from a soft overhead window light, even and diffused; observable textures include paper grain on the sketch, the cool metal of the tape measure, and the honed surface of the stone sample." +
      " Constraints: no illustration, CGI appearance, exaggerated HDR, cartoon or anime style, fake text, logos or watermark." +
      STYLE_SUFFIX,
  },
];

async function generateOne(job) {
  const outPath = join(ROOT, "public/assets", job.outputPath);
  if (existsSync(outPath)) {
    console.log(`  [skip] already exists: ${job.outputPath}`);
    return outPath;
  }

  const res = await fetch(FAL_URL, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt: job.prompt,
      aspect_ratio: job.aspectRatio,
      resolution: "2K",
      num_images: 1,
      output_format: "png",
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`fal ${res.status}: ${t}`);
  }
  const data = await res.json();
  const img = data?.images?.[0];
  if (!img?.url) throw new Error(`no image in response: ${JSON.stringify(data).slice(0, 200)}`);

  const dlRes = await fetch(img.url);
  if (!dlRes.ok) throw new Error(`download failed: ${dlRes.status}`);
  const buf = Buffer.from(await dlRes.arrayBuffer());

  const meta = await sharp(buf).metadata();
  console.log(`  raw: ${meta.width}x${meta.height}px`);

  mkdirSync(dirname(outPath), { recursive: true });

  const finalBuf = await sharp(buf)
    .resize(job.targetWidth, job.targetHeight, { fit: "cover", position: "centre" })
    .webp({ quality: 82 })
    .toBuffer();

  writeFileSync(outPath, finalBuf);
  return outPath;
}

console.log(`\n${"=".repeat(60)}`);
console.log(` IMB Single-Image Generation — ${JOBS.length} images (${jobsFileArg})`);
console.log(` Model: ${FAL_MODEL}`);
console.log(`${"=".repeat(60)}\n`);

let ok = 0, fail = 0;
for (let i = 0; i < JOBS.length; i++) {
  const job = JOBS[i];
  console.log(`> [${i + 1}/${JOBS.length}] ${job.outputPath}`);
  try {
    const outPath = await generateOne(job);
    console.log(`  -> saved ${outPath} (${job.targetWidth}x${job.targetHeight})`);
    ok++;
  } catch (err) {
    console.error(`  [ERR] ${err.message}`);
    fail++;
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log(` Done: ${ok} generated, ${fail} failed`);
console.log(`${"=".repeat(60)}\n`);
