// Servidor local que imita Vercel: archivos estáticos + funciones de /api.
// Uso: npm run dev   (lee DATABASE_URL de .env)  →  http://localhost:5173
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PORT = Number(process.env.PORT) || 5173;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json", ".webp": "image/webp", ".png": "image/png",
  ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".pdf": "application/pdf", ".ico": "image/x-icon",
};

async function handleApi(req, res, url) {
  const name = url.pathname.slice("/api/".length).replace(/\/$/, "");
  if (!/^[a-z-]+$/.test(name)) return send(res, 404, "No encontrado");
  let mod;
  try {
    mod = await import(pathToFileURL(join(ROOT, "api", `${name}.js`)).href);
  } catch {
    return send(res, 404, "No encontrado");
  }
  const handler = mod[req.method];
  if (!handler) return send(res, 405, "Método no permitido");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = chunks.length ? Buffer.concat(chunks) : undefined;
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: Object.entries(req.headers).filter(([, v]) => typeof v === "string"),
    body: ["GET", "HEAD"].includes(req.method) ? undefined : body,
  });
  const response = await handler(request);
  const headers = Object.fromEntries(response.headers);
  const cookies = response.headers.getSetCookie();
  if (cookies.length) headers["set-cookie"] = cookies;
  res.writeHead(response.status, headers);
  res.end(Buffer.from(await response.arrayBuffer()));
}

async function handleStatic(res, url) {
  let path = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  if (path.split("/").some((part) => part.startsWith(".") && part.length > 1)) return send(res, 404, "No encontrado");
  let file = join(ROOT, path);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, "index.html");
    res.writeHead(200, { "content-type": TYPES[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
    res.end(await readFile(file));
  } catch {
    send(res, 404, "No encontrado");
  }
}

function send(res, status, text) {
  res.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
  res.end(text);
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname.startsWith("/api/")) await handleApi(req, res, url);
    else await handleStatic(res, url);
  } catch (error) {
    console.error(error);
    send(res, 500, "Error del servidor");
  }
}).listen(PORT, () => console.log(`Catálogo en http://localhost:${PORT}`));
