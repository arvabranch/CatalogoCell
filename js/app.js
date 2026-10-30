import { getPhones, getAllColors, loadCatalog, resolvePhoneImage } from "./storage.js";
import { createViewer } from "./viewer.js";
import { WHATSAPP_NUMBER } from "./catalog.js";

const $ = (sel, root = document) => root.querySelector(sel);
const formatCOP = (n) => "$" + n.toLocaleString("es-CO");
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));
const colorHex = (color) => /^#[0-9a-f]{6}$/i.test(color || "") ? color : "#888888";

const storagesOf = (phone) => [...new Set((phone.variants || []).map((v) => v.storage))];
const minPrice = (phone) => {
  if (!phone.variants || phone.variants.length === 0) return null;
  return Math.min(...phone.variants.map((v) => v.price));
};
const priceFor = (phone, storage, color) => {
  if (!phone.variants) return null;
  const variant = phone.variants.find(
    (v) => v.storage === storage && (!v.colors || v.colors.length === 0 || v.colors.includes(color))
  );
  return variant ? variant.price : null;
};

let currentTab = "new";
let currentFamily = "all";

/* ---------- Render Grid & Filter Chips ---------- */

function updateCatalogView() {
  const allPhones = getPhones();
  const COLORS = getAllColors();
  
  // Filtrar según condición (tab: "new" o "used")
  const tabPhones = allPhones.filter((p) => {
    if (currentTab === "used") return p.condition === "used";
    return p.condition !== "used"; // default "new"
  });

  const isNew = currentTab === "new";
  const filtersContainer = isNew ? $("#filters-new") : $("#filters-used");
  const gridContainer = isNew ? $("#grid-new") : $("#grid-used");
  const emptyContainer = isNew ? $("#empty-new") : $("#empty-used");

  if (tabPhones.length === 0) {
    if (filtersContainer) filtersContainer.hidden = true;
    if (gridContainer) gridContainer.innerHTML = "";
    if (emptyContainer) emptyContainer.hidden = false;
    return;
  }

  if (emptyContainer) emptyContainer.hidden = true;
  if (filtersContainer) filtersContainer.hidden = false;

  // Extraer familias únicas disponibles en esta pestaña
  const families = ["all", ...new Set(tabPhones.map((p) => p.family || "Otros").filter(Boolean))];
  
  // Si la familia seleccionada ya no existe, volver a 'all'
  if (!families.includes(currentFamily)) {
    currentFamily = "all";
  }

  // Renderizar chips de filtro
  filtersContainer.innerHTML = families
    .map((fam) => {
      const label = fam === "all" ? "Todos" : (isNaN(fam) ? fam : `iPhone ${fam}`);
      const activeClass = fam === currentFamily ? "is-active" : "";
      return `<button class="chip ${activeClass}" data-family="${escapeHTML(fam)}">${escapeHTML(label)}</button>`;
    })
    .join("");

  // Re-asignar eventos a los chips
  filtersContainer.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      currentFamily = chip.dataset.family;
      filtersContainer.querySelectorAll(".chip").forEach((c) =>
        c.classList.toggle("is-active", c === chip)
      );
      renderGridItems(tabPhones, gridContainer, COLORS);
    });
  });

  renderGridItems(tabPhones, gridContainer, COLORS);
}

function renderGridItems(phones, gridContainer, COLORS) {
  const filtered = phones.filter((p) => currentFamily === "all" || p.family === currentFamily);

  if (filtered.length === 0) {
    gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--label-2); padding: 40px 0;">No se encontraron modelos para este filtro.</p>`;
    return;
  }

  gridContainer.innerHTML = filtered
    .map((p, i) => {
      const coverColor = p.cover || (p.colors && p.colors[0]) || "black";
      const imgSrc = resolvePhoneImage(p, coverColor);
      const storages = storagesOf(p).join(" · ") || "Estándar";
      const swatches = (p.colors || [])
        .map((c) => {
          const colorObj = COLORS[c] || { hex: "#888888" };
          return `<span style="--c:${colorHex(colorObj.hex)}"></span>`;
        })
        .join("");

      return `
      <button class="card" data-id="${escapeHTML(p.id)}" style="--i:${i}" aria-label="Ver ${escapeHTML(p.name)}">
        ${p.tag ? `<span class="card__tag">${escapeHTML(p.tag)}</span>` : ""}
        <div class="card__media">
          <img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(p.name)}" loading="lazy" width="600" height="600" onerror="this.src='img/phones/18promax-black.webp'">
        </div>
        <div class="card__body">
          <h3>${escapeHTML(p.name)}</h3>
          <p class="card__storage">${escapeHTML(storages)}</p>
          <div class="swatches" aria-hidden="true">
            ${swatches}
          </div>
          <p class="card__price">${minPrice(p) ? `<small>Desde</small> ${formatCOP(minPrice(p))}` : "Consultar"}</p>
        </div>
      </button>`;
    })
    .join("");
}

/* ---------- Detail sheet ---------- */

const dialog = $("#detail");
const viewer = createViewer($("#viewer"));
const PAYMENTS = {
  contraentrega: { label: "contra entrega", note: "Pagas al recibir. Antes de pagar puedes revisar que la caja esté sellada y que el equipo sea el que pediste." },
  transferencia: { label: "por transferencia anticipada", note: "Te enviamos los datos de pago solo desde este WhatsApp oficial, a nombre del vendedor." },
};

const state = { phone: null, color: null, storage: null, payment: "contraentrega" };

function openDetail(id) {
  const allPhones = getPhones();
  const phone = allPhones.find((p) => p.id === id);
  if (!phone) return;

  const COLORS = getAllColors();
  state.phone = phone;
  state.color = phone.cover || (phone.colors && phone.colors[0]) || "black";
  state.storage = storagesOf(phone)[0] || "";

  $("#detailName").textContent = phone.name;
  $("#detailTag").textContent = phone.tag || (phone.condition === "used" ? "Usado garantizado" : "Nuevo");
  $("#detailSpecs").innerHTML = (phone.specs || []).map((s) => `<li>${escapeHTML(s)}</li>`).join("");

  // Swatches
  const colors = phone.colors || [];
  $("#detailColors").innerHTML = colors
    .map((c) => {
      const col = COLORS[c] || { name: c, hex: "#888888" };
      return `<button type="button" role="radio" data-color="${escapeHTML(c)}" style="--c:${colorHex(col.hex)}"
        aria-label="${escapeHTML(col.name)}" title="${escapeHTML(col.name)}"></button>`;
    })
    .join("");

  // Storages
  const storages = storagesOf(phone);
  $("#detailStorage").innerHTML = storages
    .map((s) => `<button type="button" role="radio" data-storage="${escapeHTML(s)}">${escapeHTML(s)}</button>`)
    .join("");

  // Precargar imágenes si tienen colores
  colors.forEach((c) => {
    const img = new Image();
    img.src = resolvePhoneImage(phone, c);
  });

  updateDetail(false);
  dialog.showModal();
  viewer.spin();
  document.body.classList.add("no-scroll");
  history.replaceState(null, "", `#${phone.id}`);
}

function updateDetail(animate = true) {
  const { phone, color, storage } = state;
  const COLORS = getAllColors();
  const img = $("#detailImg");
  const src = resolvePhoneImage(phone, color);
  const colorObj = COLORS[color] || { name: color, hex: "#2b2b2d" };

  if (animate && img.getAttribute("src") !== src) {
    img.classList.add("is-swapping");
    setTimeout(() => {
      img.src = src;
      viewer.setImage(src);
      img.onload = () => img.classList.remove("is-swapping");
      img.onerror = () => {
        img.src = "img/phones/18promax-black.webp";
        img.classList.remove("is-swapping");
      };
    }, 160);
  } else {
    img.src = src;
    viewer.setImage(src);
  }
  img.alt = `${phone.name} ${colorObj.name}`;
  dialog.style.setProperty("--glow", colorHex(colorObj.hex));
  $("#detailColorName").textContent = colorObj.name;

  dialog.querySelectorAll("[data-color]").forEach((b) => {
    const on = b.dataset.color === color;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  dialog.querySelectorAll("[data-storage]").forEach((b) => {
    const on = b.dataset.storage === storage;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  dialog.querySelectorAll("[data-payment]").forEach((b) => {
    const on = b.dataset.payment === state.payment;
    b.classList.toggle("is-active", on);
    b.setAttribute("aria-checked", on);
  });
  $("#paymentNote").textContent = PAYMENTS[state.payment].note;

  const price = priceFor(phone, storage, color);
  $("#detailPrice").textContent = price ? formatCOP(price) : "Consultar";

  const condition = phone.condition === "used" ? "usado" : "nuevo";
  $("#detailWhatsapp").href = whatsappLink(
    `Hola! Me interesa el ${phone.name} ${storage} color ${colorObj.name} (${condition})` +
      (price ? ` por ${formatCOP(price)}` : "") +
      `. Quiero pagar ${PAYMENTS[state.payment].label}. ¿Está disponible?`
  );
}

function whatsappLink(text) {
  const base = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : "https://wa.me/";
  return `${base}?text=${encodeURIComponent(text)}`;
}

function closeDetail() {
  dialog.classList.add("is-closing");
  setTimeout(() => {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, 220);
}

dialog.addEventListener("close", () => {
  document.body.classList.remove("no-scroll");
  history.replaceState(null, "", location.pathname);
});
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDetail();
});
dialog.addEventListener("click", (e) => {
  if (e.target === dialog || e.target.closest(".sheet__close")) return closeDetail();
  const colorBtn = e.target.closest("[data-color]");
  if (colorBtn) {
    state.color = colorBtn.dataset.color;
    return updateDetail();
  }
  const storageBtn = e.target.closest("[data-storage]");
  if (storageBtn) {
    state.storage = storageBtn.dataset.storage;
    return updateDetail();
  }
  const paymentBtn = e.target.closest("[data-payment]");
  if (paymentBtn) {
    state.payment = paymentBtn.dataset.payment;
    updateDetail(false);
  }
});

/* ---------- Tabs (Nuevos / Usados) ---------- */

document.querySelectorAll(".tabs__btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs__btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
    currentTab = btn.dataset.tab;
    currentFamily = "all";
    $("#panel-new").hidden = currentTab !== "new";
    $("#panel-used").hidden = currentTab !== "used";
    updateCatalogView();
  })
);

// Delegación de clic para abrir detalle de producto
document.addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card && card.dataset.id) {
    openDetail(card.dataset.id);
  }
});

// Inicialización: los productos vienen de la base de datos (con el catálogo incluido como respaldo)
await loadCatalog();
updateCatalogView();

if (location.hash) {
  openDetail(location.hash.slice(1));
}
