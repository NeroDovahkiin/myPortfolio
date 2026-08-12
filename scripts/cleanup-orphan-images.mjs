/**
 * Busca imágenes en Vercel Blob (bajo proyectos/) que no están referenciadas
 * por ningún proyecto en data/projects.json. Pasa esto normalmente si subiste
 * una imagen en el admin y nunca guardaste el formulario.
 *
 * Por defecto solo lista (dry-run). Para borrarlas de verdad, agregá --delete.
 *
 * Uso:
 *   node --env-file=.env scripts/cleanup-orphan-images.mjs
 *   node --env-file=.env scripts/cleanup-orphan-images.mjs --delete
 */

import { head, list, del } from "@vercel/blob";

async function main() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Falta BLOB_READ_WRITE_TOKEN. Corré con: node --env-file=.env scripts/cleanup-orphan-images.mjs");
    process.exit(1);
  }

  const manifest = await head("data/projects.json", { token });
  const projects = await fetch(manifest.url).then((r) => r.json());

  const referenced = new Set();
  for (const p of projects) {
    if (p.image) referenced.add(p.image);
    // `images` items are GalleryImage objects ({src, fit}); older data may
    // still have plain strings.
    for (const img of p.images ?? []) referenced.add(typeof img === "string" ? img : img.src);
  }

  const orphans = [];
  let cursor;
  do {
    const { blobs, cursor: next, hasMore } = await list({ prefix: "proyectos/", token, cursor });
    for (const b of blobs) {
      if (!referenced.has(b.url)) orphans.push(b);
    }
    cursor = hasMore ? next : undefined;
  } while (cursor);

  if (orphans.length === 0) {
    console.log(`✓ Nada para limpiar (${referenced.size} imágenes referenciadas, todas en uso).`);
    return;
  }

  console.log(`${orphans.length} imágenes huérfanas encontradas:\n`);
  let totalBytes = 0;
  for (const b of orphans) {
    totalBytes += b.size;
    console.log(`  - ${b.pathname}  (${(b.size / 1024).toFixed(0)} KB)`);
  }
  console.log(`\nTotal: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);

  if (process.argv.includes("--delete")) {
    await del(orphans.map((b) => b.url), { token });
    console.log(`\n✓ Borradas ${orphans.length} imágenes.`);
  } else {
    console.log("\nEsto fue solo un listado. Corré con --delete para borrarlas.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
