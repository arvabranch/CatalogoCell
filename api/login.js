// POST /api/login: valida usuario y contraseña y abre la sesión
import { db, HttpError, json, readJSON, route, sessionCookie, verifyPassword } from "./_lib/core.js";

const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

export const POST = route(async (request) => {
  const sql = db();
  const ip = (request.headers.get("x-forwarded-for") || "local").split(",")[0].trim().slice(0, 64);

  const [attempt] = await sql`select failures, last_failure from login_attempts where ip = ${ip}`;
  const locked = attempt && attempt.failures >= MAX_FAILURES && Date.now() - new Date(attempt.last_failure).getTime() < LOCK_MINUTES * 60_000;
  if (locked) throw new HttpError(429, `Demasiados intentos. Espera ${LOCK_MINUTES} minutos e intenta de nuevo.`);

  const body = await readJSON(request, 10_000);
  const username = String(body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const [user] = await sql`select username, name, password_hash from admin_users where username = ${username}`;
  const valid = user ? await verifyPassword(password, user.password_hash) : false;

  if (!valid) {
    await sql`insert into login_attempts (ip, failures, last_failure) values (${ip}, 1, now())
      on conflict (ip) do update set
        failures = case when login_attempts.last_failure < now() - interval '15 minutes' then 1 else login_attempts.failures + 1 end,
        last_failure = now()`;
    throw new HttpError(401, "Usuario o contraseña incorrectos.");
  }

  await sql`delete from login_attempts where ip = ${ip}`;
  return json({ username: user.username, name: user.name }, 200, { "set-cookie": await sessionCookie(user.username) });
});
