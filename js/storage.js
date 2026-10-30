// Acceso a los datos del catálogo y del administrador a través de la API (/api, base de datos Neon).
// Los productos se cargan una vez con loadCatalog() y se leen de memoria; los cambios se envían al servidor.
import { NEW_PHONES, COLORS } from "./catalog.js";

let cache = { phones: [], colors: {} };

async function api(path, { method = "GET", body } = {}) {
  const response = await fetch(`api/${path}`, {
    method,
    credentials: "same-origin",
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "No se pudo conectar con el servidor.");
    error.status = response.status;
    throw error;
  }
  return data;
}

// Catálogo incluido en el sitio, por si el servidor no responde
function defaultPhones() {
  return NEW_PHONES.map((phone) => ({
    ...phone,
    imageTemplate: typeof phone.image === "function" ? phone.image("{color}") : "",
    image: undefined,
  }));
}

/* ---------- Catálogo ---------- */

export async function loadCatalog({ fallback = true } = {}) {
  try {
    const data = await api("catalog");
    cache = { phones: data.phones || [], colors: data.colors || {} };
  } catch (error) {
    if (!fallback) throw error;
    cache = { phones: defaultPhones(), colors: {} };
  }
  return cache.phones;
}

export function getPhones() {
  return cache.phones;
}

export function getAllColors() {
  return { ...COLORS, ...cache.colors };
}

export async function addPhone(product) {
  const saved = await api("phones", { method: "POST", body: product });
  cache.phones = [saved, ...cache.phones];
  return saved;
}

export async function updatePhone(id, product) {
  const saved = await api(`phones?id=${encodeURIComponent(id)}`, { method: "PUT", body: product });
  cache.phones = cache.phones.map((phone) => (phone.id === id ? saved : phone));
  return saved;
}

export async function deletePhone(id) {
  await api(`phones?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  cache.phones = cache.phones.filter((phone) => phone.id !== id);
}

export async function resetPhonesToDefault() {
  await api("phones?action=reset", { method: "POST", body: {} });
  return loadCatalog({ fallback: false });
}

export async function saveCustomColor(key, name, hex) {
  const color = await api("colors", { method: "POST", body: { key, name, hex } });
  cache.colors = { ...cache.colors, [color.key]: { name: color.name, hex: color.hex } };
  return color;
}

/* ---------- Sesión del administrador ---------- */

export async function getSession() {
  try {
    return (await api("session")).user;
  } catch {
    return null;
  }
}

export async function login(username, password) {
  try {
    const user = await api("login", { method: "POST", body: { username, password } });
    return { success: true, user };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function logout() {
  await api("logout", { method: "POST", body: {} }).catch(() => {});
}

export async function changeAdminPassword(current, next) {
  try {
    const result = await api("password", { method: "POST", body: { current, next } });
    return { success: true, message: result.message };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/* ---------- Imágenes ---------- */

export function resolvePhoneImage(phone, color) {
  if (!phone) return "img/phones/18promax-black.webp";
  const pick = color || phone.cover || "black";
  if (phone.imageMap && phone.imageMap[pick]) return phone.imageMap[pick];
  if (phone.singleImage) return phone.singleImage;
  if (phone.imageTemplate) return phone.imageTemplate.replace("{color}", pick);
  if (typeof phone.image === "function") return phone.image(pick);
  return "img/phones/18promax-black.webp";
}
