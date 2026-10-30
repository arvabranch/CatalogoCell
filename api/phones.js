// /api/phones: crear (POST), editar (PUT ?id=), eliminar (DELETE ?id=) y
// restablecer el catálogo original (POST ?action=reset). Solo administradores.
import { cleanProduct, db, HttpError, json, readJSON, requireAdmin, route, slugify, storeUploadedImages } from "./_lib/core.js";
import { defaultPhones } from "./_lib/defaults.js";

const idFrom = (request) => {
  const id = new URL(request.url).searchParams.get("id") || "";
  if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(id)) throw new HttpError(400, "Producto no válido.");
  return id;
};

export const POST = route(async (request) => {
  await requireAdmin(request);
  const sql = db();

  if (new URL(request.url).searchParams.get("action") === "reset") {
    const phones = defaultPhones();
    await sql.transaction([
      sql`delete from phones`,
      ...phones.map((phone, index) => sql`insert into phones (id, position, data) values (${phone.id}, ${index}, ${JSON.stringify(phone)}::jsonb)`),
    ]);
    return json({ ok: true });
  }

  const body = await readJSON(request);
  let id = slugify(body.name) || "producto";
  const [exists] = await sql`select 1 from phones where id = ${id}`;
  if (exists) id = `${id}-${Date.now().toString(36)}`;

  const product = await storeUploadedImages(cleanProduct(body, id));
  const [{ min }] = await sql`select coalesce(min(position), 0) as min from phones`;
  await sql`insert into phones (id, position, data) values (${id}, ${Number(min) - 1}, ${JSON.stringify(product)}::jsonb)`;
  return json(product, 201);
});

export const PUT = route(async (request) => {
  await requireAdmin(request);
  const id = idFrom(request);
  const product = await storeUploadedImages(cleanProduct(await readJSON(request), id));
  const rows = await db()`update phones set data = ${JSON.stringify(product)}::jsonb, updated_at = now() where id = ${id} returning id`;
  if (!rows.length) throw new HttpError(404, "El producto ya no existe.");
  return json(product);
});

export const DELETE = route(async (request) => {
  await requireAdmin(request);
  const id = idFrom(request);
  await db()`delete from phones where id = ${id}`;
  return json({ ok: true });
});
