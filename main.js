/* FERAS 26 · primeira direção de movimento e navegação */
"use strict";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const masthead = document.getElementById("masthead");
const progress = document.getElementById("progress");
const menuTrigger = document.getElementById("menuTrigger");
const navigation = document.getElementById("navigation");
const stage = document.getElementById("prologueStage");
const prologue = document.querySelector(".prologue");
const logo = document.querySelector(".prologue__logo");
const introText = document.querySelector(".prologue__copy");
const eventTrack = document.getElementById("eventTrack");
const dialog = document.getElementById("memoryDialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const dialogCode = document.getElementById("dialogCode");
const dialogImages = document.getElementById("dialogImages");
const dialogNote = document.getElementById("dialogNote");

let events = [];
let ticking = false;
let lastFocus = null;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

function updateScroll() {
  ticking = false;
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  progress.style.transform = "scaleX(" + clamp(window.scrollY / maxScroll, 0, 1) + ")";
  masthead.classList.toggle("scrolled", window.scrollY > 60);

  if (reduceMotion.matches || !stage || !logo) return;
  const rect = prologue.getBoundingClientRect();
  const travel = Math.max(1, prologue.offsetHeight - window.innerHeight);
  const part = clamp(-rect.top / travel, 0, 1);
  // O movimento é feito dentro da abertura; a página não muda de direção ou ordem.
  const scale = 1 + part * 0.28;
  logo.style.transform = "translate3d(0," + (-40 * part) + "px,0) scale(" + scale + ") rotate(" + (-1.8 * part) + "deg)";
  introText.style.opacity = String(clamp(1 - part * 1.5, 0.16, 1));
  stage.style.setProperty("--opening-progress", String(part));
}
window.addEventListener("scroll", () => {
  if (!ticking) { ticking = true; requestAnimationFrame(updateScroll); }
}, { passive: true });
window.addEventListener("resize", updateScroll, { passive: true });
updateScroll();

const revealObserver = ("IntersectionObserver" in window && !reduceMotion.matches)
  ? new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.13, rootMargin: "0px 0px -25px 0px" })
  : null;
function revealElements(root = document) {
  root.querySelectorAll("[data-reveal]").forEach(el => {
    if (revealObserver) revealObserver.observe(el);
    else el.classList.add("visible");
  });
}
revealElements();

function setMenu(open) {
  navigation.classList.toggle("open", open);
  navigation.inert = !open;
  menuTrigger.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("nav-open", open);
  if (open) navigation.querySelector("a")?.focus({ preventScroll: true });
  else menuTrigger.focus({ preventScroll: true });
}
menuTrigger.addEventListener("click", () => setMenu(menuTrigger.getAttribute("aria-expanded") !== "true"));
navigation.querySelectorAll("a").forEach(a => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", e => {
  if (e.key === "Escape" && navigation.classList.contains("open")) setMenu(false);
});
document.addEventListener("click", e => {
  if (navigation.classList.contains("open") && !navigation.contains(e.target) && !menuTrigger.contains(e.target)) setMenu(false);
});

const placeDescriptions = {
  portao: { label: "01 / O PORTÃO", text: "Aquele caminho de todo dia. Precisamos de fotos e vídeos daqui para reconstruir a chegada à escola." },
  patio: { label: "02 / O PÁTIO", text: "O ponto de encontro que merecia um capítulo inteiro. Aqui vão entrar as conversas, os intervalos e os registros do pátio." },
  salas: { label: "03 / AS SALAS", text: "Cada turma vai ter um espaço próprio, com seus professores, retratos e histórias que não se misturam com as de mais ninguém." },
  auditorio: { label: "04 / O AUDITÓRIO", text: "Aulões, encontros e outras lembranças que aconteceram aqui. Vamos montar a cena a partir do material real que chegar." }
};
const detail = document.getElementById("placeDetail");
document.querySelectorAll("[data-place]").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-place]").forEach(b => b.classList.remove("selected"));
    button.classList.add("selected");
    const item = placeDescriptions[button.dataset.place];
    if (!item) return;
    detail.querySelector("small").textContent = item.label;
    detail.querySelector("p").textContent = item.text;
  });
});

function makeEventCard(event, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "event-card";
  button.setAttribute("aria-label", "Abrir capítulo " + event.titulo);
  const head = document.createElement("div");
  head.className = "event-card__head";
  const number = document.createElement("span");
  number.textContent = String(index + 1).padStart(2, "0") + " / ARQUIVO";
  const state = document.createElement("span");
  state.textContent = event.estado === "publicado" ? "ABRIR ACERVO ↗" : "EM PREPARAÇÃO ↗";
  head.append(number, state);

  const shape = document.createElement("div");
  shape.className = "event-card__shape";
  shape.setAttribute("aria-hidden", "true");
  shape.textContent = event.simbolo || "✳";
  const body = document.createElement("div");
  body.className = "event-card__body";
  const h3 = document.createElement("h3");
  h3.textContent = event.titulo;
  const p = document.createElement("p");
  p.textContent = event.resumo;
  const meta = document.createElement("div");
  meta.className = "event-card__meta";
  const left = document.createElement("span"); left.textContent = "FERAS 26";
  const right = document.createElement("span"); right.textContent = "ENTRAR NO CAPÍTULO ↗";
  meta.append(left, right);
  body.append(h3, p, meta);
  button.append(head, shape, body);
  button.addEventListener("click", () => openMemory(event));
  return button;
}

function safeMediaPath(path) {
  if (typeof path !== "string") return null;
  // Só caminhos publicados dentro do próprio site: nada de URL privada do Drive.
  return /^\.\/media\/[a-zA-Z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(path) ? path : null;
}
function openMemory(event) {
  if (!dialog || typeof dialog.showModal !== "function") return;
  lastFocus = document.activeElement;
  dialogTitle.textContent = event.titulo;
  dialogText.textContent = event.texto || event.resumo;
  dialogCode.textContent = "FERAS 26 / " + event.categoria;
  dialogImages.replaceChildren();
  const media = Array.isArray(event.midias) ? event.midias : [];
  let count = 0;
  media.forEach(item => {
    const src = safeMediaPath(item.src);
    if (!src) return;
    const figure = document.createElement("figure");
    const image = document.createElement("img");
    image.src = src;
    image.loading = "lazy";
    image.alt = item.alt || "Registro do capítulo " + event.titulo;
    const caption = document.createElement("figcaption");
    caption.textContent = item.legenda || "";
    figure.append(image, caption);
    dialogImages.append(figure);
    count++;
  });
  dialogNote.hidden = count > 0;
  dialog.showModal();
}
function closeMemory() {
  if (dialog.open) dialog.close();
}
document.getElementById("dialogClose")?.addEventListener("click", closeMemory);
dialog?.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
dialog?.addEventListener("close", () => {
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
});

async function loadEvents() {
  try {
    const response = await fetch("./content/acervo.json", { cache: "no-cache" });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();
    events = Array.isArray(data.eventos) ? data.eventos : [];
    eventTrack.replaceChildren();
    if (!events.length) throw new Error("Catálogo vazio");
    events.forEach((event, index) => eventTrack.appendChild(makeEventCard(event, index)));
  } catch (error) {
    eventTrack.replaceChildren();
    const note = document.createElement("p");
    note.className = "load-note";
    note.textContent = "O catálogo de acontecimentos não abriu. Atualize a página para tentar de novo.";
    eventTrack.appendChild(note);
    console.error("FERAS26 catálogo:", error);
  }
}
loadEvents();
