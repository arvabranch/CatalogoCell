// Gestor de persistencia y autenticación en LocalStorage
import { NEW_PHONES, COLORS, MARGIN } from "./catalog.js";

const STORAGE_KEYS = {
  PHONES: "catalog_cell_phones",
  COLORS: "catalog_cell_colors",
  AUTH_USER: "catalog_cell_admin_user",
  AUTH_SESSION: "catalog_cell_admin_session",
};

// Credenciales por defecto del Administrador
const DEFAULT_ADMIN = {
  username: "admin",
  password: "admin123",
  name: "Administrador",
  role: "admin",
};

/* ==========================================================================
   AUTENTICACIÓN
   ========================================================================== */

export function getAdminUser() {
  const data = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
  if (!data) {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(DEFAULT_ADMIN));
    return DEFAULT_ADMIN;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_ADMIN;
  }
}

export function saveAdminUser(userData) {
  localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(userData));
}

export function login(username, password) {
  const admin = getAdminUser();
  const cleanUser = (username || "").trim().toLowerCase();
  const cleanPass = (password || "").trim();

  if (cleanUser === admin.username.toLowerCase() && cleanPass === admin.password) {
    const session = {
      isLoggedIn: true,
      username: admin.username,
      name: admin.name,
      loginAt: new Date().toISOString(),
    };
    sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, JSON.stringify(session));
    return { success: true, user: session };
  }

  return {
    success: false,
    message: "Usuario o contraseña incorrectos. Revisa las credenciales.",
  };
}

export function logout() {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
}

export function getSession() {
  const sessionData = sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
  if (!sessionData) return null;
  try {
    const parsed = JSON.parse(sessionData);
    return parsed.isLoggedIn ? parsed : null;
  } catch (e) {
    return null;
  }
}

export function isAuthenticated() {
  return getSession() !== null;
}

export function changeAdminPassword(currentPassword, newPassword) {
  const admin = getAdminUser();
  if (admin.password !== currentPassword) {
    return { success: false, message: "La contraseña actual no coincide." };
  }
  if (!newPassword || newPassword.length < 4) {
    return { success: false, message: "La nueva contraseña debe tener al menos 4 caracteres." };
  }

  admin.password = newPassword;
  saveAdminUser(admin);
  return { success: true, message: "Contraseña actualizada correctamente." };
}

/* ==========================================================================
   COLORES
   ========================================================================== */

export function getAllColors() {
  const custom = localStorage.getItem(STORAGE_KEYS.COLORS);
  let parsedCustom = {};
  if (custom) {
    try {
      parsedCustom = JSON.parse(custom);
    } catch (e) {
      parsedCustom = {};
    }
  }
  return { ...COLORS, ...parsedCustom };
}

export function saveCustomColor(key, name, hex) {
  const custom = localStorage.getItem(STORAGE_KEYS.COLORS);
  let parsedCustom = {};
  if (custom) {
    try {
      parsedCustom = JSON.parse(custom);
    } catch (e) {}
  }
  parsedCustom[key] = { name, hex };
  localStorage.setItem(STORAGE_KEYS.COLORS, JSON.stringify(parsedCustom));
  return getAllColors();
}

/* ==========================================================================
   PRODUCTOS / TELÉFONOS
   ========================================================================== */

function defaultPhonesToStorage() {
  return NEW_PHONES.map((phone) => {
    // Convierte función image a template string
    let imageTemplate = "";
    if (typeof phone.image === "function") {
      imageTemplate = phone.image("{color}");
    } else if (typeof phone.image === "string") {
      imageTemplate = phone.image;
    } else {
      imageTemplate = `img/phones/${phone.id}-{color}.webp`;
    }

    return {
      id: phone.id,
      name: phone.name,
      family: phone.family || "18",
      condition: phone.condition || "new",
      tag: phone.tag || "",
      cover: phone.cover || phone.colors[0],
      specs: phone.specs || [],
      colors: phone.colors || [],
      imageTemplate: imageTemplate,
      imageMap: phone.imageMap || null,
      variants: phone.variants || [],
    };
  });
}

export function getPhones() {
  const stored = localStorage.getItem(STORAGE_KEYS.PHONES);
  if (!stored) {
    const defaults = defaultPhonesToStorage();
    localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(defaults));
    return defaults;
  }
  try {
    const list = JSON.parse(stored);
    if (!Array.isArray(list)) {
      const defaults = defaultPhonesToStorage();
      localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(defaults));
      return defaults;
    }
    return list;
  } catch (e) {
    const defaults = defaultPhonesToStorage();
    localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(defaults));
    return defaults;
  }
}

export function savePhones(phones) {
  localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(phones));
}

export function resetPhonesToDefault() {
  const defaults = defaultPhonesToStorage();
  localStorage.setItem(STORAGE_KEYS.PHONES, JSON.stringify(defaults));
  return defaults;
}

export function addPhone(phoneData) {
  const phones = getPhones();
  // Generar ID único si no viene
  const id = phoneData.id || phoneData.name.toLowerCase().replace(/[^a-z0-9]/g, "-") + "-" + Date.now().toString(36);
  
  const newPhone = {
    ...phoneData,
    id: id,
    condition: phoneData.condition || "new",
    cover: phoneData.cover || (phoneData.colors && phoneData.colors[0]) || "black",
  };

  phones.unshift(newPhone); // Agregar al inicio
  savePhones(phones);
  return newPhone;
}

export function updatePhone(id, updatedData) {
  const phones = getPhones();
  const index = phones.findIndex((p) => p.id === id);
  if (index === -1) return null;

  phones[index] = {
    ...phones[index],
    ...updatedData,
    id: id, // Conservar ID
  };

  savePhones(phones);
  return phones[index];
}

export function deletePhone(id) {
  const phones = getPhones();
  const filtered = phones.filter((p) => p.id !== id);
  savePhones(filtered);
  return filtered;
}

export function resolvePhoneImage(phone, color) {
  if (!phone) return "img/phones/18promax-black.webp";
  
  // 1. Mapa de colores específico
  if (phone.imageMap && phone.imageMap[color]) {
    return phone.imageMap[color];
  }
  // 2. Si viene imagen única cargada (Data URL / enlace directo)
  if (phone.singleImage) {
    return phone.singleImage;
  }
  // 3. Plantilla con {color}
  if (phone.imageTemplate) {
    return phone.imageTemplate.replace("{color}", color || phone.cover || "black");
  }
  // 4. Si la propiedad image es función
  if (typeof phone.image === "function") {
    return phone.image(color || phone.cover || "black");
  }
  // 5. Si la propiedad image es string
  if (typeof phone.image === "string") {
    return phone.image.replace("{color}", color || phone.cover || "black");
  }
  
  return `img/phones/18promax-black.webp`;
}

export { MARGIN, DEFAULT_ADMIN };

