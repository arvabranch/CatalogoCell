// Visor 3D del celular: se gira arrastrando (mouse o dedo) y al soltar
// vuelve al frente con un efecto de resorte. Al abrir hace un giro de entrada.

const MAX_Y = 65; // grados máximos de giro horizontal
const MAX_X = 18; // grados máximos de inclinación vertical (solo mouse)
const STIFFNESS = 0.045;
const DAMPING = 0.88;

const clamp = (v, max) => Math.max(-max, Math.min(max, v));
const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function createViewer(root) {
  const stage = root.querySelector(".viewer__stage");
  const shine = root.querySelector(".viewer__shine");
  const shadow = root.querySelector(".viewer__shadow");
  const hint = root.parentElement.querySelector(".viewer__hint");

  let ry = 0, rx = 0, vy = 0, vx = 0;
  let dragging = false, lastX = 0, lastY = 0, raf = 0, lastT = 0;

  function render() {
    stage.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    shine.style.backgroundPosition = `${50 - ry * 1.4}% 50%`;
    shadow.style.transform = `translateX(${ry * -0.5}px) scaleX(${1 - Math.abs(ry) / 200})`;
  }

  function step(t) {
    const dt = lastT ? Math.min(3, (t - lastT) / 16.7) : 1;
    lastT = t;
    if (!dragging) {
      vy = (vy - ry * STIFFNESS * dt) * Math.pow(DAMPING, dt);
      vx = (vx - rx * STIFFNESS * dt) * Math.pow(DAMPING, dt);
      ry += vy * dt;
      rx += vx * dt;
    }
    render();
    const moving = Math.abs(ry) + Math.abs(rx) + Math.abs(vy) + Math.abs(vx) > 0.05;
    if (dragging || moving) {
      raf = requestAnimationFrame(step);
    } else {
      ry = rx = vy = vx = 0;
      render();
      raf = lastT = 0;
    }
  }
  const start = () => { if (!raf) raf = requestAnimationFrame(step); };

  root.addEventListener("pointerdown", (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    root.setPointerCapture(e.pointerId);
    root.classList.add("is-dragging");
    hint?.classList.add("is-hidden");
    start();
  });

  root.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    // Resistencia progresiva cerca del límite
    vy = dx * 0.45 * (1 - (Math.abs(ry) / MAX_Y) * 0.8);
    ry = clamp(ry + vy, MAX_Y);
    if (e.pointerType === "mouse") {
      vx = -dy * 0.25;
      rx = clamp(rx + vx, MAX_X);
    }
    render();
  });

  const release = () => {
    if (!dragging) return;
    dragging = false;
    root.classList.remove("is-dragging");
  };
  root.addEventListener("pointerup", release);
  root.addEventListener("pointercancel", release);

  return {
    // Giro de entrada al abrir el detalle
    spin() {
      hint?.classList.remove("is-hidden");
      if (reducedMotion()) return;
      ry = -MAX_Y;
      rx = 6;
      vy = vx = 0;
      lastT = 0;
      render();
      start();
    },
    setImage(src) {
      shine.style.webkitMaskImage = shine.style.maskImage = `url("${src}")`;
    },
  };
}
