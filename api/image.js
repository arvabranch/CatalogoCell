// GET /api/image?id=...: fotos subidas desde el admin
import { db, route } from "./_lib/core.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const GET = route(async (request) => {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!UUID_RE.test(id)) return new Response("No encontrada", { status: 404 });
  const rows = await db()`select mime, data from images where id = ${id}`;
  if (!rows.length) return new Response("No encontrada", { status: 404 });
  return new Response(Buffer.from(rows[0].data, "base64"), {
    headers: {
      "content-type": rows[0].mime,
      // Cada foto tiene un id único y nunca cambia
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    },
  });
});
