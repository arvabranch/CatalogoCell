import { BUSINESS, WHATSAPP_NUMBER } from "./catalog.js";

// Rellena los datos del negocio en las páginas legales
document.querySelectorAll("[data-biz]").forEach((el) => {
  el.textContent = BUSINESS[el.dataset.biz] || "";
});

// Oculta lo que depende de un dato que aún no está (por ejemplo, el correo)
document.querySelectorAll("[data-if]").forEach((el) => {
  el.hidden = !BUSINESS[el.dataset.if];
});

document.querySelectorAll("[data-whatsapp-link]").forEach((el) => {
  el.href = `https://wa.me/${WHATSAPP_NUMBER}`;
});

document.querySelectorAll("[data-email-link]").forEach((el) => {
  if (BUSINESS.email) el.href = `mailto:${BUSINESS.email}`;
  else el.removeAttribute("href");
});
