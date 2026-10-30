// POST /api/logout: cierra la sesión
import { clearSessionCookie, json, route } from "./_lib/core.js";

export const POST = route(async () => json({ ok: true }, 200, { "set-cookie": clearSessionCookie() }));
