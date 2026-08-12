/**
 * Migración única: lee todos los proyectos de src/content/showcase/*.json
 * y los sube como un único manifest a Vercel Blob (data/projects.json),
 * que es lo que el panel de admin y el sitio público leen en producción.
 *
 * Uso: node --env-file=.env scripts/migrate-projects-to-blob.mjs
 * (requiere BLOB_READ_WRITE_TOKEN en .env, ver Vercel → Storage → tu store → ".env.local")
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { put } from "@vercel/blob";

const SHOWCASE_DIR = new URL("../src/content/showcase/", import.meta.url);

async function main() {
  const files = (await readdir(SHOWCASE_DIR)).filter((f) => f.endsWith(".json"));

  const projects = await Promise.all(
    files.map(async (file) => {
      const slug = file.replace(/\.json$/, "");
      const raw = await readFile(new URL(file, SHOWCASE_DIR), "utf-8");
      return { slug, ...JSON.parse(raw) };
    })
  );

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error("Falta BLOB_READ_WRITE_TOKEN. Corré con: node --env-file=.env scripts/migrate-projects-to-blob.mjs");
    process.exit(1);
  }

  await put("data/projects.json", JSON.stringify(projects, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });

  console.log(`✓ Migrados ${projects.length} proyectos a Vercel Blob (data/projects.json)`);
  projects.forEach((p) => console.log(`  - ${p.slug}`));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
