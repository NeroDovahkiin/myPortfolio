export interface GalleryOptions {
  dropId: string;
  fileInputId: string;
  thumbsId: string;
  placeholderId: string;
  pathsInputId: string;
  getSlug: () => string;
  requireSlug?: boolean;
  initial?: string[];
}

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

  function currentPaths(): string[] {
    return Array.from(thumbsEl.querySelectorAll<HTMLElement>("[data-src]")).map(
      (el) => el.dataset.src!
    );
  }

  function sync() {
    const paths = currentPaths();
    pathsInput.value = JSON.stringify(paths);
    placeholder.classList.toggle("hidden", paths.length > 0);
  }

  function makeTile(src: string): HTMLElement {
    const tile = document.createElement("div");
    tile.className = "gallery-tile";
    tile.draggable = true;
    tile.dataset.src = src;
    tile.innerHTML = `
      <img src="${src}" alt="" draggable="false" />
      <span class="gallery-handle" aria-hidden="true">⠿⠿</span>
      <button type="button" class="gallery-remove" aria-label="Quitar imagen">×</button>
    `;
    tile.querySelector(".gallery-remove")!.addEventListener("click", (e) => {
      e.stopPropagation();
      tile.remove();
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

  (opts.initial ?? []).forEach((src) => thumbsEl.appendChild(makeTile(src)));
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
        const path = await uploadFile(file, slug);
        loadingTile.replaceWith(makeTile(path));
      } catch (err) {
        loadingTile.remove();
        alert((err as Error).message);
      }
      sync();
    }
    (e.target as HTMLInputElement).value = "";
  });
}
