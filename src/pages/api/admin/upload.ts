export const prerender = false;
import type { APIRoute } from "astro";
import { extname, basename } from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";

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

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    // Siempre se convierte y optimiza a webp, sin importar el formato de origen
    const outputBuffer = await sharp(inputBuffer).webp({ quality: 85 }).toBuffer();

    const blob = await put(`proyectos/${slug}/${baseName}.webp`, outputBuffer, {
      access: "public",
      // random suffix: evita servir una versión vieja cacheada en el CDN
      // si se vuelve a subir un archivo con el mismo nombre
      addRandomSuffix: true,
      contentType: "image/webp",
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });

    return new Response(JSON.stringify({ path: blob.url }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
