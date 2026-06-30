export const prerender = false;
import type { APIRoute } from "astro";
import { mkdir, writeFile } from "node:fs/promises";
import { join, extname, basename } from "node:path";
import sharp from "sharp";

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    const slug = (form.get("slug")?.toString() ?? "general").replace(/[^a-zA-Z0-9\-_]/g, "");

    if (!file || !file.name) {
      return new Response(JSON.stringify({ error: "No se recibió archivo" }), { status: 400 });
    }

    const ext = extname(file.name).toLowerCase();
    const allowed = [".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"];
    if (!allowed.includes(ext)) {
      return new Response(JSON.stringify({ error: `Extensión no permitida: ${ext}` }), { status: 400 });
    }

    const baseName = basename(file.name, ext)
      .replace(/[^a-zA-Z0-9\-_]/g, "-")
      .replace(/-+/g, "-")
      .toLowerCase();

    const webpName = `${baseName}.webp`;
    const dir = join(process.cwd(), "public", "proyectos", slug);
    await mkdir(dir, { recursive: true });

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .webp({ quality: 85 })
      .toBuffer();

    await writeFile(join(dir, webpName), outputBuffer);

    return new Response(
      JSON.stringify({ path: `/proyectos/${slug}/${webpName}` }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
