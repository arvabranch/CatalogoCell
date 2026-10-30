// GET /api/session: dice si hay una sesión de administrador activa
import { db, getSessionUser, json, route } from "./_lib/core.js";

export const GET = route(async (request) => {
  const username = await getSessionUser(request);
  if (!username) return json({ user: null });
  const [user] = await db()`select username, name from admin_users where username = ${username}`;
  return json({ user: user || null });
});
