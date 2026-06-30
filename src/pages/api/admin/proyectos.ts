export const prerender = false;
import type { APIRoute } from "astro";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const SHOWCASE_DIR = join(process.cwd(), "src", "content", "showcase");

function slugPath(slug: string) {
  // Prevent path traversal
  const safe = slug.replace(/[^a-zA-Z0-9\-_]/g, "");
  return join(SHOWCASE_DIR, `${safe}.json`);
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug, ...data } = body;
    if (!slug || !data.title) {
      return new Response(JSON.stringify({ error: "slug y title son obligatorios" }), { status: 400 });
    }
    // url defaults to slug if not set
    if (!data.url) data.url = slug;
    const path = slugPath(slug);
    // Check if already exists
    try {
      await readFile(path);
      return new Response(JSON.stringify({ error: "Ya existe un proyecto con ese slug" }), { status: 409 });
    } catch {
      // doesn't exist, we can create
    }
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug, ...data } = body;
    if (!slug || !data.title) {
      return new Response(JSON.stringify({ error: "slug y title son obligatorios" }), { status: 400 });
    }
    if (!data.url) data.url = slug;
    const path = slugPath(slug);
    await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug requerido" }), { status: 400 });
    }
    const path = slugPath(slug);
    await unlink(path);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
};
