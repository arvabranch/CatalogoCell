import { NEW_PHONES, COLORS, MARGIN } from "./catalog.js";
import { createViewer } from "./viewer.js";

const $ = (sel, root = document) => root.querySelector(sel);
const formatCOP = (n) => "$" + n.toLocaleString("es-CO");

const storagesOf = (phone) => [...new Set(phone.variants.map((v) => v.storage))];
const minPrice = (phone) => Math.min(...phone.variants.map((v) => v.price)) + MARGIN;
const priceFor = (phone, storage, color) => {
  const variant = phone.variants.find((v) => v.storage === storage && v.colors.includes(color));
  return variant && variant.price + MARGIN;
};

/* ---------- Grid ---------- */

function renderGrid(family = "all") {
  const grid = $("#grid");
  const phones = NEW_PHONES.filter((p) => family === "all" || p.family === family);
  grid.innerHTML = phones
    .map(
      (p, i) => `
      <button class="card" data-id="${p.id}" style="--i:${i}" aria-label="Ver ${p.name}">
        ${p.tag ? `<span class="card__tag">${p.tag}</span>` : ""}
        <div class="card__media">
          <img src="${p.image(p.cover || p.colors[0])}" alt="${p.name}" loading="lazy" width="600" height="600">
        </div>
        <div class="card__body">
          <h3>${p.name}</h3>
          <p class="card__storage">${storagesOf(p).join(" · ")}</p>
          <div class="swatches" aria-hidden="true">
            ${p.colors.map((c) => `<span style="--c:${COLORS[c].hex}"></span>`).join("")}
          </div>
          <p class="card__price"><small>Desde</small> ${formatCOP(minPrice(p))}</p>
        </div>
      </button>`
    )
    .join("");
}

/* ---------- Detail sheet ---------- */

const dialog = $("#detail");
const viewer = createViewer($("#viewer"));
const state = { phone: null, color: null, storage: null };

function openDetail(id) {
  const phone = NEW_PHONES.find((p) => p.id === id);
  if (!phone) return;
  state.phone = phone;
  state.color = phone.cover || phone.colors[0];
  state.storage = storagesOf(phone)[0];

  $("#detailName").textContent = phone.name;
  $("#detailTag").textContent = phone.tag || "Nuevo";
  $("#detailSpecs").innerHTML = phone.specs.map((s) => `<li>${s}</li>`).join("");

  $("#detailColors").innerHTML = phone.colors
    .map(
      (c) => `<button type="button" role="radio" data-color="${c}" style="--c:${COLORS[c].hex}"
        aria-label="${COLORS[c].name}" title="${COLORS[c].name}"></button>`
    )
    .join("");

  $("#detailStorage").innerHTML = storagesOf(phone)
    .map((s) => `<button type="button" role="radio" data-storage="${s}">${s}</button>`)
    .join("");

  // Precarga las demás imágenes para que el cambio de color sea instantáneo
  phone.colors.forEach((c) => (new Image().src = phone.image(c)));

  updateDetail(false);
  dialog.showModal();
  viewer.spin();
  document.body.classList.add("no-scroll");
  history.replaceState(null, "", `#${phone.id}`);
}

function updateDetail(animate = true) {
  const { phone, color, storage } = state;
  const img = $("#detailImg");
  const src = phone.image(color);

  if (animate && img.getAttribute("src") !== src) {
    img.classList.add("is-swapping");
    setTimeout(() => {
      img.src = src;
      viewer.setImage(src);
      img.onload = () => img.classList.remove("is-swapping");
    }, 160);
  } else {
    img.src = src;
    viewer.setImage(src);
  }
  img.alt = `${phone.name} ${COLORS[color].name}`;
  dialog.style.setProperty("--glow", COLORS[color].hex);
  $("#detailColorName").textContent = COLORS[color].name;

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

  const price = priceFor(phone, storage, color);
  $("#detailPrice").textContent = price ? formatCOP(price) : "Consultar";
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
    updateDetail();
  }
});

/* ---------- Tabs & filtros ---------- */

document.querySelectorAll(".tabs__btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tabs__btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn);
    });
    $("#panel-new").hidden = btn.dataset.tab !== "new";
    $("#panel-used").hidden = btn.dataset.tab !== "used";
  })
);

document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
    renderGrid(chip.dataset.family);
  })
);

$("#grid").addEventListener("click", (e) => {
  const card = e.target.closest(".card");
  if (card) openDetail(card.dataset.id);
});

renderGrid();
if (location.hash) openDetail(location.hash.slice(1));
