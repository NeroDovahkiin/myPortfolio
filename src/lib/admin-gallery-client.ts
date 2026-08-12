import type { GalleryImage, ImageFit } from "~/types";

export interface GalleryOptions {
  dropId: string;
  fileInputId: string;
  thumbsId: string;
  placeholderId: string;
  pathsInputId: string;
  getSlug: () => string;
  requireSlug?: boolean;
  initial?: GalleryImage[];
  defaultFit?: ImageFit;
  onChange?: (images: GalleryImage[]) => void;
}

const FIT_OPTIONS: { value: ImageFit; label: string }[] = [
  { value: "cover", label: "Cubrir" },
  { value: "contain", label: "Contener" },
  { value: "fill", label: "Rellenar" },
  { value: "none", label: "Centrar" },
  { value: "scale-down", label: "Reducir" },
];

async function uploadFile(file: File, slug: string): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("slug", slug || "general");
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Error al subir");
  }
  return (await res.json()).path;
}

export function initGallery(opts: GalleryOptions) {
  const drop = document.getElementById(opts.dropId)!;
  const fileInput = document.getElementById(opts.fileInputId) as HTMLInputElement;
  const thumbsEl = document.getElementById(opts.thumbsId)!;
  const placeholder = document.getElementById(opts.placeholderId)!;
  const pathsInput = document.getElementById(opts.pathsInputId) as HTMLInputElement;
  const defaultFit: ImageFit = opts.defaultFit ?? "contain";

  function currentImages(): GalleryImage[] {
    return Array.from(thumbsEl.querySelectorAll<HTMLElement>("[data-src]")).map((el) => ({
      src: el.dataset.src!,
      fit: (el.dataset.fit as ImageFit) || defaultFit,
    }));
  }

  function sync() {
    const images = currentImages();
    pathsInput.value = JSON.stringify(images);
    placeholder.classList.toggle("hidden", images.length > 0);
    opts.onChange?.(images);
  }

  function makeTile(img: GalleryImage): HTMLElement {
    const fit = img.fit ?? defaultFit;
    const tile = document.createElement("div");
    tile.className = "gallery-tile";
    tile.draggable = true;
    tile.dataset.src = img.src;
    tile.dataset.fit = fit;

    const optionsHtml = FIT_OPTIONS.map(
      (o) => `<option value="${o.value}"${o.value === fit ? " selected" : ""}>${o.label}</option>`
    ).join("");

    tile.innerHTML = `
      <img src="${img.src}" alt="" draggable="false" style="object-fit: ${fit};" />
      <span class="gallery-handle" aria-hidden="true">⠿⠿</span>
      <button type="button" class="gallery-remove" aria-label="Quitar imagen">×</button>
      <select class="gallery-fit-select" aria-label="Adaptación de esta imagen">${optionsHtml}</select>
    `;

    const img_ = tile.querySelector("img")!;
    const fitSelect = tile.querySelector(".gallery-fit-select") as HTMLSelectElement;

    tile.querySelector(".gallery-remove")!.addEventListener("click", (e) => {
      e.stopPropagation();
      tile.remove();
      sync();
    });
    fitSelect.addEventListener("change", () => {
      tile.dataset.fit = fitSelect.value;
      img_.style.objectFit = fitSelect.value;
      sync();
    });
    tile.addEventListener("click", (e) => e.stopPropagation());
    tile.addEventListener("dragstart", () => {
      tile.classList.add("dragging");
    });
    tile.addEventListener("dragend", () => {
      tile.classList.remove("dragging");
      sync();
    });
    return tile;
  }

  thumbsEl.addEventListener("dragover", (e) => {
    e.preventDefault();
    const dragging = thumbsEl.querySelector<HTMLElement>(".dragging");
    if (!dragging) return;
    const others = Array.from(
      thumbsEl.querySelectorAll<HTMLElement>(".gallery-tile:not(.dragging)")
    );
    const after = others.find((el) => {
      const rect = el.getBoundingClientRect();
      return e.clientX < rect.left + rect.width / 2;
    });
    thumbsEl.insertBefore(dragging, after ?? null);
  });

  (opts.initial ?? []).forEach((img) => thumbsEl.appendChild(makeTile(img)));
  sync();

  drop.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async (e) => {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    const slug = opts.getSlug();
    if (opts.requireSlug && !slug) {
      alert("Ingresá el slug primero");
      (e.target as HTMLInputElement).value = "";
      return;
    }

    for (const file of files) {
      const loadingTile = document.createElement("div");
      loadingTile.className = "gallery-tile gallery-tile-loading";
      loadingTile.innerHTML = `<div class="gallery-spinner"></div>`;
      thumbsEl.appendChild(loadingTile);
      placeholder.classList.add("hidden");

      try {
        const src = await uploadFile(file, slug);
        loadingTile.replaceWith(makeTile({ src, fit: defaultFit }));
      } catch (err) {
        loadingTile.remove();
        alert((err as Error).message);
      }
      sync();
    }
    (e.target as HTMLInputElement).value = "";
  });
}
