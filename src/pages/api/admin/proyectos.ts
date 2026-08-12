export const prerender = false;
import type { APIRoute } from "astro";
import { createProject, updateProject, deleteProject } from "~/lib/blob-projects";

function safeSlug(slug: string) {
  return String(slug).replace(/[^a-zA-Z0-9\-_]/g, "");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug: rawSlug, ...data } = body;
    if (!rawSlug || !data.title) {
      return new Response(JSON.stringify({ error: "slug y title son obligatorios" }), { status: 400 });
    }
    const slug = safeSlug(rawSlug);
    if (!data.url) data.url = slug;
    await createProject(slug, data);
    return new Response(JSON.stringify({ ok: true }), { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const status = message.includes("Ya existe") ? 409 : 500;
    return new Response(JSON.stringify({ error: message }), { status });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { slug: rawSlug, ...data } = body;
    if (!rawSlug || !data.title) {
      return new Response(JSON.stringify({ error: "slug y title son obligatorios" }), { status: 400 });
    }
    const slug = safeSlug(rawSlug);
    if (!data.url) data.url = slug;
    await updateProject(slug, data);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  try {
    const slug = url.searchParams.get("slug");
    if (!slug) {
      return new Response(JSON.stringify({ error: "slug requerido" }), { status: 400 });
    }
    await deleteProject(safeSlug(slug));
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
