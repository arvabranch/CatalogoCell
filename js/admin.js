import {
  addPhone,
  changeAdminPassword,
  deletePhone,
  getAdminUser,
  getAllColors,
  getPhones,
  getSession,
  isAuthenticated,
  login,
  logout,
  MARGIN,
  resetPhonesToDefault,
  resolvePhoneImage,
  saveCustomColor,
  updatePhone,
} from "./storage.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const formatCOP = (value) => "$" + Number(value || 0).toLocaleString("es-CO");
const slugify = (value) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const colorHex = (value) => /^#[0-9a-f]{6}$/i.test(value || "") ? value : "#888888";

const elements = {
  loginView: $("#view-login"),
  dashboard: $("#view-dashboard"),
  loginForm: $("#form-login"),
  loginAlert: $("#login-alert"),
  passwordInput: $("#login-password"),
  passwordToggle: $("#btn-toggle-pass"),
  products: $("#admin-products-list"),
  empty: $("#admin-empty-state"),
  search: $("#admin-search"),
  conditionFilter: $("#admin-filter-condition"),
  productModal: $("#modal-product"),
  productForm: $("#form-product"),
  passwordModal: $("#modal-password"),
  colorModal: $("#modal-custom-color"),
  toast: $("#toast"),
};

let editingPhone = null;
let uploadedImageData = "";
let toastTimer = 0;

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => elements.toast.classList.remove("is-visible"), 3000);
}

function showLoginMessage(message) {
  elements.loginAlert.textContent = message;
  elements.loginAlert.classList.add("login-alert--error");
}

function enterDashboard() {
  const session = getSession();
  elements.loginView.hidden = true;
  elements.dashboard.hidden = false;
  const greeting = $("#admin-greeting");
  if (greeting) greeting.textContent = session?.name || getAdminUser().name || "Administrador";
  renderProducts();
}

function enterLogin() {
  elements.dashboard.hidden = true;
  elements.loginView.hidden = false;
}

function imageURL(phone) {
  const color = phone.cover || phone.colors?.[0] || "black";
  return resolvePhoneImage(phone, color);
}

function renderProducts() {
  const phones = getPhones();
  const colors = getAllColors();
  const query = (elements.search.value || "").trim().toLocaleLowerCase("es-CO");
  const condition = elements.conditionFilter.value;
  const filtered = phones.filter((phone) => {
    const matchesText = `${phone.name} ${phone.family || ""} ${phone.tag || ""}`.toLocaleLowerCase("es-CO").includes(query);
    const matchesCondition = condition === "all" || (phone.condition || "new") === condition;
    return matchesText && matchesCondition;
  });

  $("#stat-total").textContent = phones.length;
  $("#stat-new").textContent = phones.filter((phone) => (phone.condition || "new") !== "used").length;
  $("#stat-used").textContent = phones.filter((phone) => phone.condition === "used").length;
  elements.empty.hidden = filtered.length > 0;

  elements.products.innerHTML = filtered.map((phone) => {
    const cover = phone.cover || phone.colors?.[0] || "black";
    const image = imageURL(phone);
    const variants = (phone.variants || []).map((variant) => `
      <div class="variant-row"><span>${escapeHTML(variant.storage)}</span><strong>${formatCOP(Number(variant.price) + MARGIN)}</strong></div>
    `).join("");
    const colorDots = (phone.colors || []).map((key) => {
      const color = colors[key] || { name: key, hex: "#888888" };
      return `<span class="color-dot" title="${escapeHTML(color.name)}" style="background:${colorHex(color.hex)}"></span>`;
    }).join("");

    return `
      <article class="product-admin-card">
        <div class="product-admin-card__top">
          <div class="product-admin-card__badges">
            ${phone.tag ? `<span class="badge-tag">${escapeHTML(phone.tag)}</span>` : ""}
            <span class="badge-condition ${phone.condition === "used" ? "is-used" : ""}">${phone.condition === "used" ? "Usado" : "Nuevo"}</span>
          </div>
          <img class="product-admin-card__img" src="${escapeHTML(image)}" alt="${escapeHTML(phone.name)}" loading="lazy" onerror="this.src='img/phones/18promax-black.webp'">
        </div>
        <div class="product-admin-card__body">
          <h2 class="product-admin-card__title">${escapeHTML(phone.name)}</h2>
          <div class="product-admin-card__meta">Generación ${escapeHTML(phone.family || "—")} · ${escapeHTML((phone.specs || []).join(" · "))}</div>
          <div class="product-admin-card__colors" aria-label="Colores disponibles">${colorDots || "Sin colores"}</div>
          <div class="product-admin-card__variants">${variants || "<span>Sin capacidades ni precios</span>"}</div>
          <div class="product-admin-card__actions">
            <button type="button" class="btn-secondary" data-edit-phone="${escapeHTML(phone.id)}">Editar</button>
            <button type="button" class="btn-danger-outline" data-delete-phone="${escapeHTML(phone.id)}">Eliminar</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function openModal(modal) {
  modal.hidden = false;
  document.body.classList.add("admin-modal-open");
  const focusable = $("input:not([type=hidden]), select, textarea, button", modal);
  focusable?.focus();
}

function closeModal(modal) {
  modal.hidden = true;
  if (![elements.productModal, elements.passwordModal, elements.colorModal].some((item) => !item.hidden)) {
    document.body.classList.remove("admin-modal-open");
  }
}

function renderColorChoices(selected = []) {
  const colors = getAllColors();
  $("#colors-selector-box").innerHTML = Object.entries(colors).map(([key, color]) => `
    <label class="color-choice ${selected.includes(key) ? "is-selected" : ""}">
      <input type="checkbox" value="${escapeHTML(key)}" ${selected.includes(key) ? "checked" : ""}>
      <span class="color-swatch-circle" style="background:${colorHex(color.hex)}"></span>
      <span>${escapeHTML(color.name)}</span>
    </label>
  `).join("");
}

function selectedColors() {
  return $$("#colors-selector-box input:checked").map((input) => input.value);
}

function refreshVariantColorOptions(row, selected = []) {
  const colors = getAllColors();
  $(".variant-color-options", row).innerHTML = `<span>Aplica a:</span>${selectedColors().map((key) => `
    <label><input type="checkbox" value="${escapeHTML(key)}" ${selected.includes(key) ? "checked" : ""}>
      <span>${escapeHTML(colors[key]?.name || key)}</span>
    </label>`).join("")}`;
}

function renderCoverOptions(selected = "") {
  const colors = getAllColors();
  const chosen = selectedColors();
  $("#prod-cover").innerHTML = chosen.map((key) => `<option value="${escapeHTML(key)}" ${key === selected ? "selected" : ""}>${escapeHTML(colors[key]?.name || key)}</option>`).join("");
  if (!chosen.includes($("#prod-cover").value)) $("#prod-cover").value = chosen[0] || "";
}

function renderGallery(selected = "") {
  const seen = new Set();
  const options = [];
  for (const phone of getPhones()) {
    for (const color of phone.colors || [phone.cover || "black"]) {
      const src = resolvePhoneImage(phone, color);
      if (!src || seen.has(src)) continue;
      seen.add(src);
      const colors = getAllColors();
      const colorName = colors[color]?.name || color;
      options.push(`<option value="${escapeHTML(src)}">${escapeHTML(phone.name)} · ${escapeHTML(colorName)}</option>`);
    }
  }
  if (selected && !seen.has(selected)) options.unshift(`<option value="${escapeHTML(selected)}">Imagen actual</option>`);
  $("#prod-gallery-select").innerHTML = options.join("") || `<option value="img/phones/18promax-black.webp">Imagen predeterminada</option>`;
  $("#prod-gallery-select").value = selected && [...$("#prod-gallery-select").options].some((option) => option.value === selected)
    ? selected
    : $("#prod-gallery-select").options[0]?.value || "";
}

function renderVariants(variants = []) {
  const list = $("#variants-list-container");
  list.innerHTML = "";
  (variants.length ? variants : [{ storage: "128GB", price: "" }]).forEach((variant) => addVariantRow(variant));
}

function addVariantRow(variant = {}) {
  const row = document.createElement("div");
  row.className = "variant-item-row";
  const availableColors = selectedColors();
  const applicableColors = Array.isArray(variant.colors) ? variant.colors : availableColors;
  row.innerHTML = `
    <input class="variant-storage" type="text" value="${escapeHTML(variant.storage || "")}" placeholder="128GB" aria-label="Capacidad" required>
    <input class="variant-price" type="number" value="${variant.price === undefined ? "" : Number(variant.price)}" min="0" step="1000" placeholder="Precio base COP" aria-label="Precio base en pesos colombianos" required>
    <button type="button" class="btn-danger-outline variant-remove" aria-label="Quitar capacidad">&times;</button>
    <div class="variant-color-options" aria-label="Colores incluidos en esta capacidad">
      <span>Aplica a:</span>
      ${availableColors.map((key) => `<label><input type="checkbox" value="${escapeHTML(key)}" ${applicableColors.includes(key) ? "checked" : ""}><span>${escapeHTML(getAllColors()[key]?.name || key)}</span></label>`).join("")}
    </div>
  `;
  $("#variants-list-container").append(row);
}

function updateImageSourceVisibility() {
  const source = $("#prod-img-source-type").value;
  $("#box-img-gallery").hidden = source !== "gallery";
  $("#box-img-url").hidden = source !== "url";
  $("#box-img-upload").hidden = source !== "upload";
  updateImagePreview();
}

function currentFormImage() {
  const source = $("#prod-img-source-type").value;
  if (source === "url") return $("#prod-img-url").value.trim();
  if (source === "upload") return uploadedImageData || $("#img-preview").src;
  return $("#prod-gallery-select").value;
}

function updateImagePreview() {
  const value = currentFormImage();
  if (value) $("#img-preview").src = value;
}

function resetProductForm() {
  editingPhone = null;
  uploadedImageData = "";
  elements.productForm.reset();
  $("#prod-id").value = "";
  $("#modal-product-title").textContent = "Crear Nuevo Producto";
  $("#prod-condition").value = "new";
  $("#prod-family").value = "18";
  renderColorChoices([]);
  renderCoverOptions();
  renderGallery();
  renderVariants([]);
  $("#prod-img-source-type").value = "upload";
  $("#img-preview").src = "img/phones/18promax-black.webp";
  $("#upload-file-name").hidden = true;
  $("#upload-warning").hidden = true;
  updateImageSourceVisibility();
}

function openProduct(phone = null) {
  resetProductForm();
  editingPhone = phone;
  if (phone) {
    $("#modal-product-title").textContent = "Editar Producto";
    $("#prod-id").value = phone.id;
    $("#prod-name").value = phone.name || "";
    $("#prod-condition").value = phone.condition || "new";
    $("#prod-family").value = phone.family || "";
    $("#prod-tag").value = phone.tag || "";
    $("#prod-specs").value = (phone.specs || []).join("\n");
    renderColorChoices(phone.colors || []);
    renderCoverOptions(phone.cover || phone.colors?.[0] || "");
    const selectedImage = resolvePhoneImage(phone, phone.cover || phone.colors?.[0] || "black");
    renderGallery(selectedImage);
    renderVariants(phone.variants || []);
    $("#prod-img-source-type").value = "gallery";
    $("#img-preview").src = selectedImage;
  }
  updateImageSourceVisibility();
  openModal(elements.productModal);
}

function pickProductImage() {
  const source = $("#prod-img-source-type").value;
  if (source === "url") {
    const value = $("#prod-img-url").value.trim();
    if (!value) return "";
    try {
      const url = new URL(value);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("URL no válida");
      return url.href;
    } catch {
      throw new Error("Ingresa una URL de imagen válida que comience con https:// o http://.");
    }
  }
  if (source === "upload") {
    if (!uploadedImageData) throw new Error("Selecciona una imagen para subir.");
    return uploadedImageData;
  }
  return $("#prod-gallery-select").value;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) return reject(new Error("El archivo debe ser una imagen."));
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("No se pudo abrir la foto. Usa PNG, WEBP o JPG (las fotos HEIC del iPhone pueden no abrirse en todos los navegadores)."));
      image.onload = () => {
        const scale = Math.min(1, 1000 / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve({ data: canvas.toDataURL("image/webp", 0.82), width: image.width, height: image.height });
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function collectProductData() {
  const name = $("#prod-name").value.trim();
  const family = $("#prod-family").value.trim();
  const colors = selectedColors();
  const cover = $("#prod-cover").value || colors[0];
  if (!name) throw new Error("Escribe el nombre del modelo.");
  if (!family) throw new Error("Escribe la familia o generación.");
  if (!colors.length) throw new Error("Selecciona al menos un color.");
  if (!cover || !colors.includes(cover)) throw new Error("Elige un color de portada válido.");

  const variants = $$(".variant-item-row").map((row) => ({
    storage: $(".variant-storage", row).value.trim(),
    price: Number($(".variant-price", row).value),
    colors: $$(".variant-color-options input:checked", row).map((input) => input.value),
  }));
  if (!variants.length || variants.some((variant, index) => !$(".variant-price", $$(".variant-item-row")[index]).value.trim() || !variant.storage || !Number.isFinite(variant.price) || variant.price <= 0 || !variant.colors.length)) {
    throw new Error("Completa al menos una capacidad y un precio base válido.");
  }

  const image = pickProductImage();
  if (!image) throw new Error("Selecciona una imagen para el producto.");
  let id = editingPhone?.id || slugify(name) || `producto-${Date.now().toString(36)}`;
  if (!editingPhone && getPhones().some((phone) => phone.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }
  const product = {
    id,
    name,
    family,
    condition: $("#prod-condition").value,
    tag: $("#prod-tag").value.trim(),
    specs: $("#prod-specs").value.split("\n").map((line) => line.trim()).filter(Boolean),
    cover,
    colors,
    variants,
  };

  const previousImage = editingPhone ? resolvePhoneImage(editingPhone, cover || "black") : "";
  if (editingPhone && image === previousImage) {
    if (editingPhone.imageTemplate) product.imageTemplate = editingPhone.imageTemplate;
    if (editingPhone.imageMap) product.imageMap = editingPhone.imageMap;
    if (editingPhone.singleImage) product.singleImage = editingPhone.singleImage;
  } else {
    product.singleImage = image;
    product.imageMap = null;
    product.imageTemplate = "";
  }
  return product;
}

elements.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  elements.loginAlert.classList.remove("login-alert--error");
  elements.loginAlert.textContent = "";
  const result = login($("#login-username").value, elements.passwordInput.value);
  if (!result.success) return showLoginMessage(result.message);
  elements.loginForm.reset();
  enterDashboard();
});

elements.passwordToggle.addEventListener("click", () => {
  const visible = elements.passwordInput.type === "password";
  elements.passwordInput.type = visible ? "text" : "password";
  elements.passwordToggle.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
});

$("#btn-logout").addEventListener("click", () => {
  logout();
  enterLogin();
  showToast("Sesión cerrada.");
});

$("#btn-new-product").addEventListener("click", () => openProduct());
$("#btn-add-variant").addEventListener("click", () => addVariantRow());
$("#btn-add-custom-color").addEventListener("click", () => openModal(elements.colorModal));
$("#btn-open-password-modal").addEventListener("click", () => openModal(elements.passwordModal));
elements.search.addEventListener("input", renderProducts);
elements.conditionFilter.addEventListener("change", renderProducts);

elements.products.addEventListener("click", (event) => {
  const editButton = event.target.closest("[data-edit-phone]");
  if (editButton) {
    const phone = getPhones().find((item) => item.id === editButton.dataset.editPhone);
    if (phone) openProduct(phone);
    return;
  }
  const deleteButton = event.target.closest("[data-delete-phone]");
  if (deleteButton) {
    const phone = getPhones().find((item) => item.id === deleteButton.dataset.deletePhone);
    if (!phone || !window.confirm(`¿Eliminar ${phone.name} del catálogo?`)) return;
    deletePhone(phone.id);
    renderProducts();
    showToast("Producto eliminado del catálogo.");
  }
});

elements.productForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const product = collectProductData();
    if (editingPhone) updatePhone(editingPhone.id, product);
    else addPhone(product);
    closeModal(elements.productModal);
    renderProducts();
    showToast(editingPhone ? "Producto actualizado." : "Producto agregado al catálogo.");
  } catch (error) {
    showToast(error.message || "No se pudo guardar el producto.", true);
  }
});

$("#colors-selector-box").addEventListener("change", (event) => {
  if (event.target.matches("input[type=checkbox]")) {
    event.target.closest(".color-choice").classList.toggle("is-selected", event.target.checked);
    renderCoverOptions($("#prod-cover").value);
    const available = new Set(selectedColors());
    $$(".variant-item-row").forEach((row) => {
      const previous = new Set($$(".variant-color-options input:checked", row).map((input) => input.value));
      refreshVariantColorOptions(row, previous.size ? [...previous] : [...available]);
    });
  }
});

$("#variants-list-container").addEventListener("click", (event) => {
  const remove = event.target.closest(".variant-remove");
  if (!remove) return;
  const rows = $$(".variant-item-row");
  if (rows.length === 1) {
    $(".variant-storage", rows[0]).value = "";
    $(".variant-price", rows[0]).value = "";
  } else {
    remove.closest(".variant-item-row").remove();
  }
});

$("#prod-cover").addEventListener("change", () => {
  if (editingPhone && $("#prod-img-source-type").value === "gallery" && editingPhone.imageMap) {
    renderGallery(resolvePhoneImage(editingPhone, $("#prod-cover").value));
  }
  updateImagePreview();
});

$("#prod-img-source-type").addEventListener("change", updateImageSourceVisibility);
$("#prod-gallery-select").addEventListener("change", updateImagePreview);
$("#prod-img-url").addEventListener("input", updateImagePreview);
document.querySelectorAll("[data-margin-label]").forEach((el) => (el.textContent = formatCOP(MARGIN)));

// Revisa la foto contra las recomendaciones y avisa sin bloquear
function photoWarnings({ width, height }) {
  const warnings = [];
  if (Math.min(width, height) < 800) {
    warnings.push(`La foto es pequeña (${width} × ${height} px) y puede verse borrosa. Recomendado: mínimo 1000 × 1000 px.`);
  }
  if (Math.max(width, height) / Math.min(width, height) > 1.25) {
    warnings.push("La foto no es cuadrada; en el catálogo quedará con espacios a los lados. Recomendado: formato 1:1.");
  }
  return warnings;
}

async function handlePhotoFile(file) {
  uploadedImageData = "";
  $("#upload-warning").hidden = true;
  $("#upload-file-name").hidden = true;
  if (!file) return;
  try {
    const result = await compressImage(file);
    uploadedImageData = result.data;
    $("#upload-file-name").textContent = `✓ ${file.name}`;
    $("#upload-file-name").hidden = false;
    const warnings = photoWarnings(result);
    if (warnings.length) {
      $("#upload-warning").textContent = warnings.join(" ");
      $("#upload-warning").hidden = false;
    }
    updateImagePreview();
  } catch (error) {
    showToast(error.message || "No se pudo cargar la imagen.", true);
  }
}

$("#prod-img-file").addEventListener("change", (event) => handlePhotoFile(event.target.files?.[0]));

const uploadDrop = $("#upload-drop");
["dragenter", "dragover"].forEach((type) =>
  uploadDrop.addEventListener(type, (event) => {
    event.preventDefault();
    uploadDrop.classList.add("is-dragover");
  })
);
["dragleave", "drop"].forEach((type) =>
  uploadDrop.addEventListener(type, () => uploadDrop.classList.remove("is-dragover"))
);
uploadDrop.addEventListener("drop", (event) => {
  event.preventDefault();
  handlePhotoFile(event.dataTransfer.files?.[0]);
});

$("#btn-reset-catalog").addEventListener("click", () => {
  if (!window.confirm("Esto reemplazará todos los cambios y productos agregados por el catálogo original. ¿Continuar?")) return;
  resetPhonesToDefault();
  renderProducts();
  showToast("Catálogo original restaurado.");
});

$("#form-password").addEventListener("submit", (event) => {
  event.preventDefault();
  const newPassword = $("#pass-new").value;
  if (newPassword !== $("#pass-confirm").value) return showToast("Las contraseñas nuevas no coinciden.", true);
  const result = changeAdminPassword($("#pass-current").value, newPassword);
  if (!result.success) return showToast(result.message, true);
  event.currentTarget.reset();
  closeModal(elements.passwordModal);
  showToast(result.message);
});

$("#form-custom-color").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = $("#color-name").value.trim();
  const hex = $("#color-hex").value.trim();
  if (!name || !/^#[0-9a-f]{6}$/i.test(hex)) return showToast("Escribe un nombre y un color hexadecimal válido.", true);
  const key = slugify(name);
  if (!key) return showToast("Escribe un nombre de color válido.", true);
  saveCustomColor(key, name, hex);
  const selected = [...selectedColors(), key];
  renderColorChoices(selected);
  renderCoverOptions(key);
  $$(".variant-item-row").forEach((row) => {
    const previous = $$(".variant-color-options input:checked", row).map((input) => input.value);
    refreshVariantColorOptions(row, [...previous, key]);
  });
  event.currentTarget.reset();
  closeModal(elements.colorModal);
  showToast("Color agregado al selector.");
});

$("#color-picker").addEventListener("input", (event) => { $("#color-hex").value = event.target.value; });
$("#color-hex").addEventListener("input", (event) => {
  if (/^#[0-9a-f]{6}$/i.test(event.target.value)) $("#color-picker").value = event.target.value;
});

document.addEventListener("click", (event) => {
  const close = event.target.closest("[data-close-modal]");
  if (close) closeModal(close.closest(".admin-modal-overlay"));
  if (event.target.classList.contains("admin-modal-overlay")) closeModal(event.target);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  [elements.productModal, elements.passwordModal, elements.colorModal].forEach((modal) => {
    if (!modal.hidden) closeModal(modal);
  });
});

if (isAuthenticated()) enterDashboard();
else enterLogin();
