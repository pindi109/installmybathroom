// Generates smaller width variants of every hero image for responsive srcset.
// Originals (1834w) are left untouched; this only adds -480w/-768w/-1200w siblings.
import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const HEROES_DIR = path.join(process.cwd(), "public/assets/heroes");
const WIDTHS = [480, 768, 1200];

async function findHeroFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  let files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await findHeroFiles(full));
    } else if (entry.name.endsWith(".webp") && !/-\d+w\.webp$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

const originals = await findHeroFiles(HEROES_DIR);
console.log(`Found ${originals.length} original hero images.\n`);

let generated = 0;
let skipped = 0;

for (const file of originals) {
  const dir = path.dirname(file);
  const base = path.basename(file, ".webp");

  for (const width of WIDTHS) {
    const outPath = path.join(dir, `${base}-${width}w.webp`);
    if (await exists(outPath)) {
      skipped++;
      continue;
    }
    await sharp(file)
      .resize({ width })
      .webp({ quality: 82 })
      .toFile(outPath);
    generated++;
    console.log(`  -> ${path.relative(process.cwd(), outPath)}`);
  }
}

console.log(`\nDone: ${generated} generated, ${skipped} already existed.`);
