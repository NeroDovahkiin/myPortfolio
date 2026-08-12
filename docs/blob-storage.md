# Storage de imágenes (Vercel Blob)

El panel de admin guarda datos y archivos en [Vercel Blob](https://vercel.com/docs/vercel-blob) en vez de escribir al filesystem del proyecto (necesario porque en producción, Vercel corre las funciones serverless con filesystem de solo lectura).

- **Datos de proyectos**: un único blob `data/projects.json` con el array completo de proyectos. Se lee entero, se modifica en memoria, se reescribe entero. Está en [`src/lib/blob-projects.ts`](../src/lib/blob-projects.ts).
- **Imágenes**: cada subida desde el admin ([`src/pages/api/admin/upload.ts`](../src/pages/api/admin/upload.ts)) se convierte a webp (calidad 85, con `sharp`) y se guarda como blob bajo `proyectos/{slug}/{archivo}.webp`.

Las imágenes viejas que ya estaban en `public/proyectos/*` (de antes de esta migración) siguen sirviéndose como archivos estáticos normales — no están en Blob y no las toca nada de lo de acá abajo.

## Por qué cada subida crea un blob nuevo

Cada upload usa `addRandomSuffix: true`, así que subir un archivo con el mismo nombre no sobrescribe el anterior — crea uno nuevo con un sufijo random.

Es a propósito: los blobs públicos se cachean agresivamente en el CDN de Vercel. Si reemplazás una imagen sobrescribiendo la misma URL, el sitio podría seguir sirviendo la versión vieja desde el caché de algún edge server por un rato. Con URLs siempre nuevas, ese problema no existe — pero como efecto secundario, la imagen anterior queda "suelta" en el storage si nadie la borra explícitamente.

## Qué se borra automáticamente

En [`blob-projects.ts`](../src/lib/blob-projects.ts):

- **Editar un proyecto** (`updateProject`): compara las imágenes del proyecto antes y después de guardar. Las que ya no están referenciadas (reemplazaste la miniatura, sacaste una foto de la galería) se borran de Blob.
- **Eliminar un proyecto** (`deleteProject`): borra el proyecto del manifest y todas sus imágenes (miniatura + galería) de Blob.

Ambos casos solo borran URLs que son blobs reales (`https://*.public.blob.vercel-storage.com/...`) — nunca tocan las rutas viejas `/proyectos/algo.webp` servidas desde `public/`. Si el borrado de alguna imagen falla, no bloquea el guardado del proyecto; solo queda un `console.error` en los logs.

## Qué NO se borra automáticamente

Si subís una imagen en el formulario de "nuevo" o "editar" y **nunca hacés clic en "Guardar"**, esa imagen ya está en Blob pero ningún proyecto la referencia. Nadie se entera de que la abandonaste, así que no hay forma de limpiarla en el momento.

Para esos casos existe [`scripts/cleanup-orphan-images.mjs`](../scripts/cleanup-orphan-images.mjs): lista todas las imágenes bajo `proyectos/` en Blob, las compara contra lo que efectivamente está referenciado en `data/projects.json`, y reporta (o borra) lo que sobra.

```bash
# Solo lista las huérfanas, no borra nada (dry-run)
node --env-file=.env scripts/cleanup-orphan-images.mjs

# Las borra de verdad
node --env-file=.env scripts/cleanup-orphan-images.mjs --delete
```

Requiere `BLOB_READ_WRITE_TOKEN` en `.env` (mismo token que usa el resto del panel). Conviene correrlo de vez en cuando, sobre todo después de una sesión donde subiste varias imágenes de prueba sin guardar.

## Migración inicial

[`scripts/migrate-projects-to-blob.mjs`](../scripts/migrate-projects-to-blob.mjs) fue el script que subió los proyectos originales (los que estaban en `src/content/showcase/*.json`) al manifest de Blob la primera vez. Es un script de un solo uso — no hace falta volver a correrlo, salvo que quieras resetear el manifest desde esos archivos originales.
