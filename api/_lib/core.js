// Utilidades compartidas por las funciones de /api (Vercel): base de datos, sesión,
// contraseñas y validación. Los archivos que empiezan por "_" no se publican como rutas.
import { neon } from "@neondatabase/serverless";
import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

let client;
export function db() {
  if (!process.env.DATABASE_URL) throw new HttpError(503, "La base de datos no está configurada.");
  client ??= neon(process.env.DATABASE_URL);
  return client;
}

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

// Envuelve un manejador para responder errores en JSON sin filtrar detalles internos
export function route(handler) {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message }, error.status);
      console.error(error);
      return json({ error: "Ocurrió un error en el servidor. Intenta de nuevo." }, 500);
    }
  };
}

export async function readJSON(request, maxBytes = 4_000_000) {
  if (!(request.headers.get("content-type") || "").includes("application/json")) {
    throw new HttpError(415, "Formato no soportado.");
  }
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "La información enviada es demasiado grande.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Datos inválidos.");
  }
}

/* ---------- Contraseñas ---------- */

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

export async function verifyPassword(password, stored) {
  const [scheme, saltB64, hashB64] = String(stored || "").split("$");
  if (scheme !== "scrypt" || !saltB64 || !hashB64) return false;
  const expected = Buffer.from(hashB64, "base64");
  const actual = await scryptAsync(password, Buffer.from(saltB64, "base64"), expected.length);
  return timingSafeEqual(expected, actual);
}

/* ---------- Sesión (cookie firmada) ---------- */

const COOKIE = "admin_session";
const SESSION_HOURS = 12;
let secretCache;

async function sessionSecret() {
  if (secretCache) return secretCache;
  const sql = db();
  const rows = await sql`select value from settings where key = 'session_secret'`;
  if (!rows.length) throw new HttpError(503, "La base de datos no está inicializada.");
  secretCache = rows[0].value;
  return secretCache;
}

function sign(value, secret) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function sessionCookie(username) {
  const payload = Buffer.from(JSON.stringify({ u: username, exp: Date.now() + SESSION_HOURS * 3600_000 })).toString("base64url");
  const token = `${payload}.${sign(payload, await sessionSecret())}`;
  return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function getSessionUser(request) {
  const cookie = request.headers.get("cookie") || "";
  const token = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, await sessionSecret());
  if (expected.length !== signature.length || !timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return data.exp > Date.now() ? data.u : null;
  } catch {
    return null;
  }
}

// Cambios solo desde el mismo sitio y con sesión válida
export async function requireAdmin(request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) {
    throw new HttpError(403, "Origen no permitido.");
  }
  const user = await getSessionUser(request);
  if (!user) throw new HttpError(401, "Tu sesión terminó. Vuelve a ingresar.");
  return user;
}

/* ---------- Validación de productos ---------- */

const KEY_RE = /^[a-z0-9][a-z0-9-]{0,59}$/;
const text = (value, max) => String(value ?? "").trim().slice(0, max);

// Solo se aceptan imágenes del propio sitio o https; nunca otros esquemas
export function safeImageRef(value) {
  const v = String(value || "").trim();
  if (!v) return "";
  if (/^(img\/|api\/image\?id=)[\w\-./?=&{}]*$/.test(v)) return v;
  if (/^https:\/\/[^\s"'<>]+$/i.test(v)) return v;
  if (/^data:image\/(webp|png|jpeg);base64,[a-z0-9+/=]+$/i.test(v)) return v;
  throw new HttpError(400, "La imagen del producto no es válida.");
}

export function cleanProduct(input, id) {
  if (!input || typeof input !== "object") throw new HttpError(400, "Datos del producto inválidos.");
  const name = text(input.name, 80);
  if (!name) throw new HttpError(400, "Escribe el nombre del modelo.");
  const colors = (Array.isArray(input.colors) ? input.colors : []).map(String).filter((c) => KEY_RE.test(c)).slice(0, 30);
  if (!colors.length) throw new HttpError(400, "Selecciona al menos un color.");
  const variants = (Array.isArray(input.variants) ? input.variants : []).slice(0, 20).map((v) => ({
    storage: text(v?.storage, 20),
    price: Math.round(Number(v?.price)),
    colors: (Array.isArray(v?.colors) ? v.colors : []).map(String).filter((c) => colors.includes(c)),
  }));
  if (!variants.length || variants.some((v) => !v.storage || !Number.isFinite(v.price) || v.price <= 0 || v.price > 200_000_000 || !v.colors.length)) {
    throw new HttpError(400, "Revisa las capacidades y los precios.");
  }
  const imageMap = input.imageMap && typeof input.imageMap === "object"
    ? Object.fromEntries(Object.entries(input.imageMap).filter(([k]) => KEY_RE.test(k)).map(([k, v]) => [k, safeImageRef(v)]))
    : null;
  return {
    id,
    name,
    family: text(input.family, 20),
    condition: input.condition === "used" ? "used" : "new",
    tag: text(input.tag, 40),
    specs: (Array.isArray(input.specs) ? input.specs : []).map((s) => text(s, 60)).filter(Boolean).slice(0, 8),
    cover: colors.includes(input.cover) ? input.cover : colors[0],
    colors,
    variants,
    imageTemplate: input.imageTemplate ? safeImageRef(input.imageTemplate) : "",
    imageMap: imageMap && Object.keys(imageMap).length ? imageMap : null,
    singleImage: input.singleImage ? safeImageRef(input.singleImage) : "",
  };
}

export function slugify(value) {
  return String(value).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 50);
}

// Guarda en la tabla de imágenes las fotos subidas (data URL) y deja solo su enlace
export async function storeUploadedImages(product) {
  const sql = db();
  const save = async (value) => {
    const match = /^data:(image\/(?:webp|png|jpeg));base64,(.+)$/i.exec(value || "");
    if (!match) return value;
    if (match[2].length > 3_000_000) throw new HttpError(413, "La foto es demasiado pesada.");
    const [row] = await sql`insert into images (mime, data) values (${match[1].toLowerCase()}, ${match[2]}) returning id`;
    return `api/image?id=${row.id}`;
  };
  product.singleImage = await save(product.singleImage);
  if (product.imageMap) {
    for (const key of Object.keys(product.imageMap)) product.imageMap[key] = await save(product.imageMap[key]);
  }
  return product;
}
