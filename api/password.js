// POST /api/password: cambia la contraseña del administrador
import { db, hashPassword, HttpError, json, readJSON, requireAdmin, route, verifyPassword } from "./_lib/core.js";

export const POST = route(async (request) => {
  const username = await requireAdmin(request);
  const { current, next } = await readJSON(request, 10_000);
  if (typeof next !== "string" || next.length < 8) {
    throw new HttpError(400, "La nueva contraseña debe tener al menos 8 caracteres.");
  }
  const sql = db();
  const [user] = await sql`select password_hash from admin_users where username = ${username}`;
  if (!user || !(await verifyPassword(String(current || ""), user.password_hash))) {
    throw new HttpError(400, "La contraseña actual no coincide.");
  }
  await sql`update admin_users set password_hash = ${await hashPassword(next)}, updated_at = now() where username = ${username}`;
  return json({ message: "Contraseña actualizada." });
});
