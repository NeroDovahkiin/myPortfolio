import { get, put, del } from "@vercel/blob";
import type { Project } from "~/types";

const PROJECTS_PATH = "data/projects.json";
const token = import.meta.env.BLOB_READ_WRITE_TOKEN;

// Solo se borran URLs que efectivamente son blobs (no rutas locales viejas de /public)
function isBlobUrl(url: string | undefined): url is string {
  return !!url && /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(url);
}

function collectImages(p: Pick<Project, "image" | "images"> | undefined): string[] {
  if (!p) return [];
  return [p.image, ...(p.images ?? [])].filter((x): x is string => !!x);
}

async function deleteBlobImages(urls: string[]): Promise<void> {
  const blobUrls = [...new Set(urls.filter(isBlobUrl))];
  if (blobUrls.length === 0) return;
  try {
    await del(blobUrls, { token });
  } catch (e) {
    // no bloquea el guardado/borrado del proyecto si la limpieza falla
    console.error("No se pudieron borrar imágenes huérfanas:", e);
  }
}

export async function getAllProjects(): Promise<Project[]> {
  const result = await get(PROJECTS_PATH, { access: "public", useCache: false, token });
  if (!result || result.statusCode !== 200) return [];
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as Project[];
}

async function saveAllProjects(projects: Project[]): Promise<void> {
  await put(PROJECTS_PATH, JSON.stringify(projects, null, 2), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const projects = await getAllProjects();
  return projects.find((p) => p.slug === slug) ?? null;
}

export async function createProject(slug: string, data: Omit<Project, "slug">): Promise<void> {
  const projects = await getAllProjects();
  if (projects.some((p) => p.slug === slug)) {
    throw new Error("Ya existe un proyecto con ese slug");
  }
  projects.push({ slug, ...data });
  await saveAllProjects(projects);
}

export async function updateProject(slug: string, data: Omit<Project, "slug">): Promise<void> {
  const projects = await getAllProjects();
  const idx = projects.findIndex((p) => p.slug === slug);
  if (idx === -1) throw new Error("Proyecto no encontrado");
  const removedImages = collectImages(projects[idx]).filter((u) => !collectImages(data).includes(u));
  projects[idx] = { slug, ...data };
  await saveAllProjects(projects);
  await deleteBlobImages(removedImages);
}

export async function deleteProject(slug: string): Promise<void> {
  const projects = await getAllProjects();
  const target = projects.find((p) => p.slug === slug);
  await saveAllProjects(projects.filter((p) => p.slug !== slug));
  await deleteBlobImages(collectImages(target));
}
