/**
 * Convierte todas las imágenes PNG/JPG/JPEG del directorio public/
 * a WebP con calidad 82, preservando los originales.
 *
 * Uso: node scripts/optimize-images.mjs
 *
 * Después de ejecutarlo, actualiza las rutas en los archivos JSON
 * de src/content/showcase/ para que apunten a los .webp generados.
 */

import sharp from "sharp";
import { readdir, stat } from "node:fs/promises";
import { join, extname, basename } from "node:path";

const PUBLIC_DIR = new URL("../public", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const WEBP_QUALITY = 82;
const SKIP_ALREADY_WEBP = true;

async function walkDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walkDir(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const allFiles = await walkDir(PUBLIC_DIR);
  const images = allFiles.filter((f) => /\.(png|jpe?g)$/i.test(f));

  console.log(`\nEncontradas ${images.length} imágenes PNG/JPG para convertir...\n`);

  let saved = 0;
  let totalOriginal = 0;
  let totalWebp = 0;

  for (const src of images) {
    const dest = src.replace(/\.(png|jpe?g)$/i, ".webp");

    const { size: origSize } = await stat(src);
    totalOriginal += origSize;

    await sharp(src).webp({ quality: WEBP_QUALITY }).toFile(dest);

    const { size: webpSize } = await stat(dest);
    totalWebp += webpSize;

    const reduction = (((origSize - webpSize) / origSize) * 100).toFixed(1);
    const origKb = (origSize / 1024).toFixed(0);
    const webpKb = (webpSize / 1024).toFixed(0);
    console.log(`  ${basename(src).padEnd(30)} ${origKb}KB → ${webpKb}KB  (-${reduction}%)`);
    saved++;
  }

  const totalReduction = (((totalOriginal - totalWebp) / totalOriginal) * 100).toFixed(1);
  console.log(`\n✓ ${saved} imágenes convertidas`);
  console.log(`  Total original : ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Total WebP     : ${(totalWebp / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Ahorro         : ${totalReduction}%\n`);
  console.log("Próximo paso: actualizar las rutas .png/.jpg → .webp en src/content/showcase/*.json\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
