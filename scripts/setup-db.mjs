// Crea las tablas en Neon y carga el catálogo inicial. Se puede correr varias veces:
// solo agrega lo que falta y nunca borra productos existentes.
// Uso: npm run db:setup   (lee DATABASE_URL de .env)
import { randomBytes } from "node:crypto";
import { db, hashPassword } from "../api/_lib/core.js";
import { defaultPhones, DEFAULT_COLORS, SCHEMA } from "../api/_lib/defaults.js";

const sql = db();

for (const statement of SCHEMA) await sql.query(statement);
console.log("✓ Tablas listas");

const [{ count }] = await sql`select count(*)::int as count from phones`;
if (count === 0) {
  const phones = defaultPhones();
  for (const [index, phone] of phones.entries()) {
    await sql`insert into phones (id, position, data) values (${phone.id}, ${index}, ${JSON.stringify(phone)}::jsonb)`;
  }
  console.log(`✓ ${phones.length} productos cargados`);
} else {
  console.log(`• Ya hay ${count} productos; no se modifican`);
}

for (const [key, color] of Object.entries(DEFAULT_COLORS)) {
  await sql`insert into colors (key, name, hex) values (${key}, ${color.name}, ${color.hex}) on conflict (key) do nothing`;
}
console.log("✓ Colores listos");

const admins = await sql`select username from admin_users`;
if (!admins.length) {
  await sql`insert into admin_users (username, name, password_hash) values ('admin', 'Administrador', ${await hashPassword("admin123")})`;
  console.log("✓ Usuario admin creado (cambia la contraseña en el primer ingreso)");
} else {
  console.log("• El usuario admin ya existe; su contraseña no se modifica");
}

await sql`insert into settings (key, value) values ('session_secret', ${randomBytes(32).toString("base64url")}) on conflict (key) do nothing`;
console.log("✓ Clave de sesión lista");
