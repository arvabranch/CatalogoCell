// POST /api/colors: agrega o actualiza un color personalizado
import { db, HttpError, json, readJSON, requireAdmin, route, slugify } from "./_lib/core.js";

export const POST = route(async (request) => {
  await requireAdmin(request);
  const body = await readJSON(request, 10_000);
  const name = String(body.name || "").trim().slice(0, 40);
  const hex = String(body.hex || "").trim();
  const key = slugify(body.key || name);
  if (!name || !key || !/^#[0-9a-f]{6}$/i.test(hex)) throw new HttpError(400, "Escribe un nombre y un color válido.");
  await db()`insert into colors (key, name, hex) values (${key}, ${name}, ${hex})
    on conflict (key) do update set name = excluded.name, hex = excluded.hex`;
  return json({ key, name, hex });
});
