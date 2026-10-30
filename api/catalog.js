// GET /api/catalog: productos y colores para el catálogo público y el admin
import { db, json, route } from "./_lib/core.js";

export const GET = route(async () => {
  const sql = db();
  const [phones, colors] = await Promise.all([
    sql`select data from phones order by position, id`,
    sql`select key, name, hex from colors`,
  ]);
  return json(
    {
      phones: phones.map((row) => row.data),
      colors: Object.fromEntries(colors.map((c) => [c.key, { name: c.name, hex: c.hex }])),
    },
    200,
    // El navegador siempre pide la versión actual; solo el CDN de Vercel guarda una copia
    // por 10 segundos para no consultar la base en cada visita.
    { "cache-control": "no-store", "vercel-cdn-cache-control": "max-age=10" }
  );
});
